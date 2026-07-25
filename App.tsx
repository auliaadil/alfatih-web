import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Home from './src/pages/Home';
import PackageDetailPage from './src/pages/PackageDetailPage';
import { AuthGuard } from './src/components/AuthGuard';
import { RoleGuard } from './src/components/admin/RoleGuard';
import Login from './src/pages/admin/Login';
import AdminLayout from './src/pages/admin/AdminLayout';
import Dashboard from './src/pages/admin/Dashboard';
import Orders from './src/pages/admin/Orders';
import Packages from './src/pages/admin/Packages';
import PrivateTrips from './src/pages/admin/PrivateTrips';
import Airlines from './src/pages/admin/Airlines';
import Hotels from './src/pages/admin/Hotels';
import SiteSettings from './src/pages/admin/SiteSettings';
import PosterMaker from './src/pages/admin/PosterMaker';
import PosterTemplates from './src/pages/admin/PosterTemplates';
import TextCampaign from './src/pages/admin/TextCampaign';
import DealHunter from './src/pages/admin/DealHunter';
import PackageWizard from './src/pages/admin/PackageWizard';
import Airports from './src/pages/admin/Airports';
import Categories from './src/pages/admin/Categories';
import Users from './src/pages/admin/Users';
import Documentations from './src/pages/admin/Documentations';
import Agents from './src/pages/admin/Agents';
import HotelBookings from './src/pages/admin/HotelBookings';
import FlightBookings from './src/pages/admin/FlightBookings';
import { SiteSettingsProvider } from './src/contexts/SiteSettingsContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AuthProvider } from './src/contexts/AuthContext';

const App: React.FC = () => {
    return (
        <>
        <SiteSettingsProvider>
            <LanguageProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/package/:slug" element={<PackageDetailPage />} />

                            {/* Admin Auth */}
                            <Route path="/admin/login" element={<Login />} />

                            {/* Admin Secured Routes */}
                            <Route path="/admin" element={<AuthGuard />}>
                                <Route element={<AdminLayout />}>
                                    <Route index element={<Dashboard />} />
                                    <Route path="orders" element={<Orders />} />
                                    <Route path="packages" element={<Packages />} />
                                    <Route path="packages/new" element={<PackageWizard />} />
                                    <Route path="packages/:id/edit" element={<PackageWizard />} />
                                    <Route path="documentations" element={<Documentations />} />
                                    <Route path="airports" element={<Airports />} />
                                    <Route path="categories" element={<Categories />} />
                                    <Route path="private-trips" element={<PrivateTrips />} />
                                    <Route path="airlines" element={<Airlines />} />
                                    <Route path="hotels" element={<Hotels />} />
                                    <Route path="agents" element={<Agents />} />
                                    <Route path="hotel-bookings" element={<HotelBookings />} />
                                    <Route path="flight-bookings" element={<FlightBookings />} />
                                    <Route path="poster-maker" element={<PosterMaker />} />
                                    <Route path="poster-templates" element={<PosterTemplates />} />
                                    <Route path="text-campaign" element={<TextCampaign />} />
                                    <Route element={<RoleGuard roles={['admin', 'superadmin']} />}>
                                      <Route path="deal-hunter" element={<DealHunter />} />
                                    </Route>
                                    <Route path="settings" element={<SiteSettings />} />
                                    <Route element={<RoleGuard roles={['superadmin']} />}>
                                        <Route path="users" element={<Users />} />
                                    </Route>
                                </Route>
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </LanguageProvider>
        </SiteSettingsProvider>
        <Analytics />
        <SpeedInsights />
        </>
    );
};

export default App;
