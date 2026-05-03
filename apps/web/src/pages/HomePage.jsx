import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

export default function HomePage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login', { replace: true });
            return;
        }

        const dashboardPath =
            currentUser.role === 'Subtekinfo'
                ? '/subtekinfo/dashboard'
                : currentUser.role === 'Padal'
                    ? '/padal/dashboard'
                    : currentUser.role === 'Teknisi'
                        ? '/teknisi/tickets'
                        : '/satker/dashboard';

        navigate(dashboardPath, { replace: true });
    }, [currentUser, navigate]);

    return null;
}