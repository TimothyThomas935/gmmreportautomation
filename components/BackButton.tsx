'use client'; // Marks this as a Client Component

import { useRouter } from 'next/navigation';

const BackButton = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
      aria-label="Go back to previous page"
    >
      Back
    </button>
  );
};

export default BackButton;