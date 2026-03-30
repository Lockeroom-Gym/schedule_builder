export function ConfigMissing() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Supabase is not configured</h1>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          This app needs Supabase environment variables at <strong>build time</strong> (Vite embeds them
          into the bundle). If this page is blank without this message, the build likely crashed before
          React mounted — add the variables below and redeploy.
        </p>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vercel</p>
          <ol className="text-sm text-gray-700 list-decimal list-inside space-y-2">
            <li>Open your project → Settings → Environment Variables</li>
            <li>
              Add <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> for
              Production (and Preview if you use it)
            </li>
            <li>
              Trigger a new deployment — <strong>Redeploy</strong> from the Deployments tab (env vars are
              read when Vite builds, not only at runtime)
            </li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Local</p>
          <p className="text-sm text-gray-600">
            Copy <code className="text-xs bg-white px-1 py-0.5 rounded border">.env.example</code> to{' '}
            <code className="text-xs bg-white px-1 py-0.5 rounded border">.env.local</code> and fill in
            values from the Supabase dashboard (Settings → API).
          </p>
        </div>
      </div>
    </div>
  )
}
