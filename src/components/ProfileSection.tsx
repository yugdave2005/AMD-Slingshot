
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { fetchMoodHistory, fetchMindGraph } from "@/lib/db";
import { Download, User as UserIcon, LogOut } from "lucide-react";
import Achievements from "./Achievements";
import { toast } from "sonner";

const ProfileSection = () => {
    const { user, logout } = useAuth();

    const handleExportData = async () => {
        if (!user) return;
        try {
            toast.loading("Preparing your data...");
            const moodHistory = await fetchMoodHistory(user.uid);
            const mindGraph = await fetchMindGraph(user.uid);

            const exportData = {
                user: {
                    email: user.email,
                    uid: user.uid,
                    displayName: user.displayName,
                },
                moodHistory,
                mindGraph,
                exportDate: new Date().toISOString(),
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `wellweave_export_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            toast.success("Data exported successfully!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export data.");
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 max-w-4xl py-8 animate-in fade-in-50">
            <Card className="card-neural mb-8">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <UserIcon className="w-8 h-8" />
                        )}
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">{user.displayName || "Traveler"}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </div>
                    <div className="ml-auto">
                        <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Account Handling</h3>
                            <Button variant="outline" onClick={handleExportData} className="w-full sm:w-auto">
                                <Download className="w-4 h-4 mr-2" /> Export My Data (JSON)
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Download a copy of your journal entries, mood history, and mind graph data.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Achievements />
        </div>
    );
};

export default ProfileSection;
