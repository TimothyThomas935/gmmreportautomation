import BackButton from '../../components/BackButton';
import type { NextPage } from 'next';

const FirstNorthMainsPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-[url('/img/1stNorthMains.png')] bg-cover bg-center">
      <div className="container mx-auto p-4">
        <BackButton />
        <h1 className="text-3xl font-bold mt-4">1stNorthMains</h1>
        {/* Add page-specific content here */}
      </div>
    </div>
  );
};

export default FirstNorthMainsPage;