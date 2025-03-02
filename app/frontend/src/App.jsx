import { Suspense, lazy } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Spinner } from 'react-bootstrap'
import './App.css'

// Lazy load the Dashboard page
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <Suspense fallback={
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard...</p>
      </div>
    }>
      <Dashboard />
    </Suspense>
  )
}

export default App
