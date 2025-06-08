import { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, LogIn, Mail } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithGoogle, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sign in to HotsPots
          </DialogTitle>
          <DialogDescription>
            Create an account or sign in to save your favorite WiFi hotspots and contribute new locations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading || loading}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Mail className="h-4 w-4" />
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            By signing in, you agree to save and share WiFi hotspot information to help the community.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}