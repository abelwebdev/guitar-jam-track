import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Not Found</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Could not find requested resource</p>
        <Link 
          href="/"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}