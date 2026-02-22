"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
// Load .env.local
dotenv_1.default.config({ path: (0, path_1.resolve)(process.cwd(), '.env.local') });
var supabaseUrl = process.env.VITE_SUPABASE_URL;
var supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}
// We need the service role key to bypass RLS for an update of all rows
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}
function migrateSlugs() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, packages, fetchError, _i, packages_1, pkg, slug, updateError;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('Fetching all packages...');
                    return [4 /*yield*/, supabase
                            .from('packages')
                            .select('id, title')];
                case 1:
                    _a = _b.sent(), packages = _a.data, fetchError = _a.error;
                    if (fetchError) {
                        console.error('Error fetching packages:', fetchError);
                        return [2 /*return*/];
                    }
                    if (!packages || packages.length === 0) {
                        console.log('No packages found to migrate.');
                        return [2 /*return*/];
                    }
                    console.log("Found ".concat(packages.length, " packages to process."));
                    _i = 0, packages_1 = packages;
                    _b.label = 2;
                case 2:
                    if (!(_i < packages_1.length)) return [3 /*break*/, 5];
                    pkg = packages_1[_i];
                    slug = generateSlug(pkg.title);
                    // In a real production environment with many users we might need to check for duplicates
                    // But since this is a controlled admin environment, a direct slug is likely safe.
                    // If we wanted to be perfectly safe we could do: `${slug}-${pkg.id.split('-')[0]}`
                    console.log("Updating package ".concat(pkg.id, " with slug: ").concat(slug));
                    return [4 /*yield*/, supabase
                            .from('packages')
                            .update({ slug: slug })
                            .eq('id', pkg.id)];
                case 3:
                    updateError = (_b.sent()).error;
                    if (updateError) {
                        console.error("Failed to update package ".concat(pkg.id, ":"), updateError);
                    }
                    else {
                        console.log("Successfully updated ".concat(pkg.id));
                    }
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log('Migration complete!');
                    return [2 /*return*/];
            }
        });
    });
}
migrateSlugs();
