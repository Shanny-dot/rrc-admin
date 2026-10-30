import { useQuery } from '@tanstack/react-query';
import { api } from './axios';

// The signed-in staff member's access level (owner / manager / staff / viewer) and what it
// allows, so pages show only what they can use. The server checks every action anyway.
export function useAccess() {
    const { data, isLoading } = useQuery({
        queryKey: ['adminMe'],
        queryFn: async () => (await api.get('/api/v1/admin/me')).data,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
    const permissions = new Set(data?.permissions || []);
    return {
        loading: isLoading,
        role: data?.role,
        roleLabel: data?.role_label,
        email: data?.email,
        can: (permission) => permissions.has(permission),
    };
}
