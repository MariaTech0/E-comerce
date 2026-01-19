import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load pages
const HomePage = lazy(() => import('../pages/home/page'));
const CatalogPage = lazy(() => import('../pages/catalog/page'));
const ProductPage = lazy(() => import('../pages/product/page'));
const AboutPage = lazy(() => import('../pages/about/page'));
const ContactPage = lazy(() => import('../pages/contact/page'));
const CheckoutPage = lazy(() => import('../pages/checkout/page'));
const OrderSuccessPage = lazy(() => import('../pages/order-success/page'));
const MyLibraryPage = lazy(() => import('../pages/my-library/page'));
const ProfilePage = lazy(() => import('../pages/profile/page'));

// Auth pages
const LoginPage = lazy(() => import('../pages/auth/login/page'));
const RegisterPage = lazy(() => import('../pages/auth/register/page'));

// Dashboard Admin - COMPLETAMENTE SEPARADO
const DashboardPage = lazy(() => import('../pages/dashboard/page'));

// 404
const NotFoundPage = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/catalog',
    element: <CatalogPage />,
  },
  {
    path: '/product/:slug',
    element: <ProductPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/order-success',
    element: <OrderSuccessPage />,
  },
  {
    path: '/my-library',
    element: <MyLibraryPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export default routes;
