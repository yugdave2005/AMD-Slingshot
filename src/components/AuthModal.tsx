
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner"; // Assuming sonner is installed as per package.json 
import { FcGoogle } from "react-icons/fc";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("signin");

    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState(""); // For signup

    const handleAction = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "signin") {
                await signIn(email, password);
                toast.success("Welcome back!");
            } else {
                await signUp(email, password, username);
                toast.success("Account created successfully!");
            }
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            toast.success("Welcome back!");
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to sign in with Google.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Welcome to WellWeave</DialogTitle>
                    <DialogDescription>
                        {activeTab === "signin"
                            ? "Sign in to access your mind weave."
                            : "Create an account to start your journey."}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="signin" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <div className="space-y-4 py-4">
                        {activeTab === "signup" && (
                            <div className="space-y-2">
                                <Label htmlFor="username">Display Name</Label>
                                <Input
                                    id="username"
                                    placeholder="Traveler"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="hello@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button onClick={handleAction} disabled={isLoading}>
                            {isLoading ? "Please wait..." : (activeTab === "signin" ? "Sign In" : "Sign Up")}
                        </Button>
                    </div>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                        <FcGoogle className="mr-2 h-4 w-4" />
                        Google
                    </Button>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AuthModal;
