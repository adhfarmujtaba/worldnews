// pages/_app.js
import Layout from '../components/Layout';
import { ToastContainer } from 'react-toastify';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css'; // Import NProgress styles
import '../app/styles/nprogress.css'; // Import custom NProgress styles if needed
import '../global.css';
import { useEffect, useRef } from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Set a delay before starting NProgress
      timerRef.current = setTimeout(() => {
        NProgress.start();
      }, 250); // Adjust delay as needed (100ms here)
    };

    const handleRouteChangeComplete = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      NProgress.done();
    };

    const handleRouteChangeError = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      NProgress.done();
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    // Cleanup event listeners on unmount
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
      // Ensure NProgress is completed if the component is unmounted
      NProgress.done();
    };
  }, [router]);

  // Check if the current route is '/login' or '/register'
  const excludeLayout = ['/login', '/register'].includes(router.pathname);

  return (
    <div>
      <ToastContainer autoClose={3000} />
      {/* Render layout only if the route is not '/login' or '/register' */}
      {!excludeLayout ? (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        <Component {...pageProps} />
      )}
    </div>
  );
}

export default MyApp;
