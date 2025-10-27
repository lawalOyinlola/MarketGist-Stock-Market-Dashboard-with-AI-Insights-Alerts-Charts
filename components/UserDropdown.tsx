"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import NavItems from "./NavItems";
import { signOut } from "@/lib/actions/auth.actions";
import { toast } from "sonner";

const UserDropdown = ({
  user,
  initialStocks,
}: {
  user: User;
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut: () => Promise<void> = async () => {
    const result = await signOut();
    if (result?.success === false) {
      toast.error("Sign out failed", {
        description: result.error || "Please try again",
      });
      return;
    }
    toast.success("Signed out successfully!", {
      description: "Redirecting...",
    });
    setTimeout(() => {
      router.push("/sign-in");
    }, 1000);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 text-gray-400 hover:text-app-color"
        >
          <UserAvatar user={user} />
          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-gray-400">
              {user.name}
            </span>
          </div>
          <ChevronsUpDownIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-gray-400">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
            <UserAvatar user={user} />
            <div className="flex flex-col">
              <span className="text-base font-medium text-gray-400">
                {user.name}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-600" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-app-color transition-colors cursor-pointer"
        >
          <LogOutIcon className="h-4 w-4 mr-2 hidden sm:block" />
          Logout
        </DropdownMenuItem>
        <DropdownMenuSeparator className="block sm:hidden bg-gray-600" />
        <nav className="sm:hidden">
          <NavItems
            initialStocks={initialStocks}
            onItemClick={() => setOpen(false)}
          />
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UserAvatar = ({
  size = "h-8 w-8",
  user,
}: {
  size?: string;
  user: User;
}) => (
  <Avatar className={size}>
    <AvatarImage src="/assets/images/lawal_oyinlola-profile_picture.png" />
    <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
      {user?.name?.[0] || "U"}
    </AvatarFallback>
  </Avatar>
);

export default UserDropdown;
