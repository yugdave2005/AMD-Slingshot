
import { Button } from "@/components/ui/button";

const ContactSection = () => {
    return (
        <section id="contact" className="py-20 bg-secondary/30 relative overflow-hidden">
            <div className="container mx-auto px-6 text-center relative z-10">
                <h2 className="text-3xl font-bold mb-6 text-foreground">Get in Touch</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Have questions or feedback? We'd love to hear from you.
                </p>

                <form className="max-w-md mx-auto bg-card p-8 rounded-2xl shadow-sm border border-border" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="Your Email"
                            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                        />
                        <textarea
                            placeholder="Your Message"
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                        ></textarea>
                        <Button className="w-full rounded-full h-12 text-lg">Send Message</Button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default ContactSection;
