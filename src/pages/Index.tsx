import { Navigate } from 'react-router-dom';

// Legacy Index route — redirects to Overview
const Index = () => <Navigate to="/" replace />;
export default Index;
