import { UseGlobalContext } from '../Context';
import Login from '../pages/Login';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, authLoading } = UseGlobalContext();

  // Agar authentication yuklanayotgan bo'lsa, loading ko'rsatamiz
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Agar foydalanuvchi tizimga kirmagan bo'lsa, Login sahifasiga yo'naltiramiz
  if (!isAuthenticated) {
    return <Login />;
  }

  // Agar ma'lum rol talab qilinsa va foydalanuvchi bu rolga ega bo'lmasa
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: 'red'
      }}>
        Bu sahifaga kirish uchun sizda ruxsat yo'q!
      </div>
    );
  }

  // Agar barcha shartlar bajarilgan bo'lsa, children komponentlarini ko'rsatamiz
  return children;
};

export default ProtectedRoute;