"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { ChevronsUpDownIcon, LogInIcon, UserRoundIcon } from "lucide-react";
import NavItems from "./NavItems";

const GuestDropdown = ({
  email,
  initialStocks,
}: {
  email?: string | null;
  initialStocks: StockWithWatchlistStatus[];
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close dropdown when navigating to a new page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleSignIn = () => {
    setOpen(false);
    router.push("/sign-in");
  };

  // Get email prefix (part before @)
  const emailPrefix = email ? email.split("@")[0] : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 text-gray-400 hover:text-app-color"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-app-color text-gray-900 text-sm font-bol">
              <UserRoundIcon className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-gray-400">
              {emailPrefix ? `Guest: ${emailPrefix}` : "Guest"}
            </span>
          </div>
          <ChevronsUpDownIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="text-gray-400 min-w-40">
        <DropdownMenuLabel>
          <div className="flex relative items-center gap-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-700 text-gray-400 text-sm font-bold">
                {email ? email.charAt(0).toUpperCase() : "G"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="text-base font-medium text-gray-400">Guest</span>
              {email && <span className="text-sm text-gray-500">{email}</span>}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-600" />

        <DropdownMenuItem
          onClick={handleSignIn}
          className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-app-color transition-colors cursor-pointer"
        >
          <LogInIcon className="h-4 w-4 mr-2 hidden sm:block" />
          Sign In
        </DropdownMenuItem>

        <DropdownMenuSeparator className="block sm:hidden bg-gray-600" />
        <nav className="sm:hidden">
          <NavItems
            initialStocks={initialStocks}
            onItemClick={() => setOpen(false)}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GuestDropdown;
