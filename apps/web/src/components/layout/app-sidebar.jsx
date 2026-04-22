import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { getSidebarData } from './sidebar-data';
import { NavGroup } from './nav-group';
import { NavUser } from './nav-user';
import { useAuth } from '@/contexts/AuthContext';

export function AppSidebar() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'User';
  const sidebarData = getSidebarData(role);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <img
            src="/images/logo_bidtik.png"
            alt="Logo BIDTIK"
            className="size-8 rounded-lg object-cover"
          />
          <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            IT Helpdesk
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
