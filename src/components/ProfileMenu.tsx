import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, UserRound, Copy, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProfileMenuProps {
  account: string;
  onDisconnect: () => void;
  onOpenSettings: () => void;
}

const ProfileMenu = ({ account, onDisconnect, onOpenSettings }: ProfileMenuProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(account);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          className="button-primary flex items-center gap-2" 
          variant="default"
        >
          <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
          </div>
          <span className="hidden sm:inline-block">
            {shortenAddress(account)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 glass-card border-white/10 backdrop-blur-md">
        <div className="flex items-center justify-center p-3">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
              <UserRound className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium truncate max-w-[200px]">{shortenAddress(account)}</p>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2 hover:bg-white/5"
          onClick={copyAddressToClipboard}
        >
          <Copy className="w-4 h-4" />
          <span>{t('copy_address')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2 hover:bg-white/5"
          onClick={() => {
            onOpenSettings();
            setIsOpen(false);
          }}
        >
          <Settings className="w-4 h-4" />
          <span>{t('settings')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem 
          className="cursor-pointer flex items-center gap-2 text-red-500 hover:bg-white/5"
          onClick={() => {
            onDisconnect();
            setIsOpen(false);
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>{t('disconnect_wallet')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
