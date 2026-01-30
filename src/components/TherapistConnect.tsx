
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock, Video, Star, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Mock Therapist Data
const MOCK_THERAPISTS = [
    {
        id: 1,
        name: "Dr. Elena Foster",
        specialty: "Anxiety & Stress Management",
        rating: 4.9,
        experience: "12 years",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
        availableTimes: ["09:00", "11:00", "14:00", "16:00"]
    },
    {
        id: 2,
        name: "Dr. Marcus Chen",
        specialty: "Cognitive Behavioral Therapy",
        rating: 4.8,
        experience: "15 years",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
        availableTimes: ["10:00", "13:00", "15:00", "17:00"]
    },
    {
        id: 3,
        name: "Sarah Williams, LMFT",
        specialty: "Relationship & Family Counseling",
        rating: 4.9,
        experience: "8 years",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300&h=300",
        availableTimes: ["09:30", "11:30", "14:30", "16:30"]
    }
];

const TherapistConnect = () => {
    const { user, googleAccessToken, signInWithGoogle } = useAuth();
    const [selectedTherapist, setSelectedTherapist] = useState<number | null>(null);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState<string>("");
    const [isScheduling, setIsScheduling] = useState(false);

    const handleSchedule = async () => {
        if (!selectedTherapist || !date || !time) {
            toast.error("Please select a therapist, date, and time.");
            return;
        }

        if (!user) {
            toast.error("Please sign in to schedule a session.");
            return;
        }

        if (!googleAccessToken) {
            try {
                await signInWithGoogle();
            } catch (error) {
                toast.error("Failed to connect Google Account.");
                return;
            }
        }

        setIsScheduling(true);
        const therapist = MOCK_THERAPISTS.find(t => t.id === selectedTherapist);

        try {
            // Calculate start and end times
            const [hours, minutes] = time.split(':').map(Number);
            const startTime = new Date(date);
            startTime.setHours(hours, minutes, 0);

            const endTime = new Date(startTime);
            endTime.setHours(hours + 1, minutes, 0); // 1 hour session

            // Create Google Calendar Event
            const event = {
                summary: `Therapy Session with ${therapist?.name}`,
                description: `Session focused on ${therapist?.specialty}.`,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                conferenceData: {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7),
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            };

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Calendar API Error:", errorData);
                throw new Error(errorData.error?.message || 'Failed to create calendar event');
            }

            const data = await response.json();

            toast.success("Session Scheduled!", {
                description: `Added to your calendar with Google Meet link: ${data.htmlLink}`,
                action: {
                    label: "Open Event",
                    onClick: () => window.open(data.htmlLink, '_blank'),
                }
            });

            // Reset form
            setSelectedTherapist(null);
            setDate(undefined);
            setTime("");

        } catch (error: any) {
            console.error("Scheduling Error:", error);
            toast.error(`Failed to schedule session: ${error.message || "Unknown error"}`);

            // If permission error, might need re-auth
            if (!googleAccessToken) {
                toast("Authentication required", {
                    description: "We need access to your calendar to schedule the session.",
                    action: {
                        label: "Connect Google",
                        onClick: () => signInWithGoogle(),
                    }
                })
            }
        } finally {
            setIsScheduling(false);
        }
    };

    const selectedTherapistData = MOCK_THERAPISTS.find(t => t.id === selectedTherapist);

    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600 mb-2">Connect with a Specialist</h2>
                <p className="text-muted-foreground">Professional support for your mental wellness journey.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {MOCK_THERAPISTS.map((therapist) => (
                    <Card
                        key={therapist.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-md border-2",
                            selectedTherapist === therapist.id ? "border-primary bg-primary/5" : "border-transparent"
                        )}
                        onClick={() => setSelectedTherapist(therapist.id)}
                    >
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-primary/20">
                                <img src={therapist.image} alt={therapist.name} className="w-full h-full object-cover" />
                            </div>
                            <CardTitle className="text-lg">{therapist.name}</CardTitle>
                            <CardDescription className="text-primary font-medium">{therapist.specialty}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center text-sm text-muted-foreground">
                            <div className="flex justify-center items-center gap-4 mb-2">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span>{therapist.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-green-500" />
                                    <span>Verified</span>
                                </div>
                            </div>
                            <p>{therapist.experience} Experience</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedTherapist && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 border-primary/20 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Schedule with {selectedTherapistData?.name}</CardTitle>
                        <CardDescription>Select a date and time for your 1-hour session.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-sm font-medium">Select Date</label>
                            <div className="flex justify-center border rounded-md p-4 bg-background">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-sm font-medium">Available Times</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedTherapistData?.availableTimes.map((t) => (
                                        <Button
                                            key={t}
                                            variant={time === t ? "default" : "outline"}
                                            onClick={() => setTime(t)}
                                            className="w-full justify-start pl-4"
                                        >
                                            <Clock className="w-4 h-4 mr-2" />
                                            {t}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Video className="w-4 h-4 text-primary" />
                                    <span>Video call via Google Meet</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                    <span>Added to Google Calendar</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center bg-secondary/10 py-6">
                        <div className="text-sm text-muted-foreground">
                            {date && time ? (
                                <span>Selected: <span className="font-semibold text-foreground">{format(date, "MMMM do, yyyy")} at {time}</span></span>
                            ) : (
                                <span>Please select date & time</span>
                            )}
                        </div>
                        <Button
                            size="lg"
                            onClick={handleSchedule}
                            disabled={!date || !time || isScheduling}
                            className="min-w-[150px]"
                        >
                            {isScheduling ? "Scheduling..." : "Confirm Booking"}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
};

export default TherapistConnect;
