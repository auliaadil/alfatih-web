import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './src/pages/Home';
import PackageDetailPage from './src/pages/PackageDetailPage';
import { AuthGuard } from './src/components/AuthGuard';
import Login from './src/pages/admin/Login';
import AdminLayout from './src/pages/admin/AdminLayout';
import Dashboard from './src/pages/admin/Dashboard';
import Orders from './src/pages/admin/Orders';
import Packages from './src/pages/admin/Packages';
import PrivateTrips from './src/pages/admin/PrivateTrips';
import Airlines from './src/pages/admin/Airlines';
import Hotels from './src/pages/admin/Hotels';
import SiteSettings from './src/pages/admin/SiteSettings';
import { SiteSettingsProvider } from './src/contexts/SiteSettingsContext';
import { LanguageProvider } from './src/contexts/LanguageContext';

const App: React.FC = () => {
    return (
        <SiteSettingsProvider>
            <LanguageProvider>
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
                                <Route path="private-trips" element={<PrivateTrips />} />
                                <Route path="airlines" element={<Airlines />} />
                                <Route path="hotels" element={<Hotels />} />
                                <Route path="settings" element={<SiteSettings />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </LanguageProvider>
        </SiteSettingsProvider>
    );
};

export default App;