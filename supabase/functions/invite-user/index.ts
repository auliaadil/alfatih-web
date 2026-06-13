import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    // Verify caller is superadmin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Unauthorized' }, 401)

    const { data: callerProfile } = await callerClient
      .from('user_profiles').select('role').eq('id', caller.id).single()
    if (callerProfile?.role !== 'superadmin') return json({ error: 'Forbidden' }, 403)

    const body = await req.json()
    const { action, email, role, display_name, branch_ids, userId } = body

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    if (action === 'resend') {
      // Resend invite to an existing pending user by re-inviting with same email
      const { error } = await adminClient.auth.admin.inviteUserByEmail(email)
      if (error) return json({ error: error.message }, 400)
      return json({ success: true })
    }

    // Default: new invite
    if (!email || !role) return json({ error: 'email and role are required' }, 400)
    if (!['superadmin', 'admin', 'branch_admin'].includes(role)) {
      return json({ error: 'Invalid role' }, 400)
    }

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)
    if (inviteError) return json({ error: inviteError.message }, 400)

    const newUserId = inviteData.user.id

    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert({ id: newUserId, email, display_name: display_name ?? '', role, invite_pending: true })
    if (profileError) return json({ error: profileError.message }, 500)

    if (role === 'branch_admin' && Array.isArray(branch_ids) && branch_ids.length > 0) {
      const { error: branchError } = await adminClient
        .from('user_branches')
        .insert(branch_ids.map((bid: string) => ({ user_id: newUserId, branch_id: bid })))
      if (branchError) return json({ error: branchError.message }, 500)
    }

    return json({ success: true, userId: newUserId })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
