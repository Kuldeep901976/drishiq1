import AdManagerDashboard from '../../../components/AdManagerDashboard';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';

export default function AdManagerPage() {
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        <AdManagerDashboard />
      </main>
      
      <Footer />
    </>
  );
} 