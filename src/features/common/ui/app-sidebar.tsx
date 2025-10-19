"use client";

import type { User } from "@supabase/supabase-js";
import { ChevronUp, User2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SIDEBAR_MENU } from "@/constants/consts";
import { useAuth } from "@/features/auth";
import { KakaoLoginButton } from ".";

function AppSidebar() {
  const { user, logOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup title="생성">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {SIDEBAR_MENU.map((menu) => (
                  <SidebarMenuButton
                    key={menu.href}
                    className="cursor-pointer"
                    asChild
                  >
                    <Link href={menu.href}>{menu.label}</Link>
                  </SidebarMenuButton>
                ))}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent user={user} onLogOut={logOut} />
      </SidebarFooter>
    </Sidebar>
  );
}

interface SidebarFooterContentProps {
  user: User | undefined;
  onLogOut: () => void;
}

function SidebarFooterContent({ user, onLogOut }: SidebarFooterContentProps) {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const displayName = user?.user_metadata?.name || user?.email || "사용자";

  // 클라이언트 마운트 상태 추적 (Hydration 오류 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hydration 완료 전까지는 로딩 상태 표시
  if (!isMounted) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className="cursor-pointer" disabled>
            <User2 />
            <span>로딩중...</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // 비로그인 상태
  if (!user) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="cursor-pointer"
              onClick={() => setIsLoginDialogOpen(true)}
            >
              <User2 />
              <span>로그인</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>로그인</DialogTitle>
              <DialogDescription>
                카카오 계정으로 로그인하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <KakaoLoginButton next="/" />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 로그인 상태
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="cursor-pointer">
              <User2 /> {displayName}
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem className="cursor-pointer">
              <span>계정</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <span>설정</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogOut} className="cursor-pointer">
              <span>로그아웃</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default AppSidebar;
