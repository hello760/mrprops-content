import { ExternalLink } from "lucide-react";

export function Team() {
  const team = [
    {
      name: "Helvis Schmotex",
      role: "Founder",
      image: "/assets/Helvis_Smoteks_profile_photo_1766935918595.png",
      linkedin: "https://www.linkedin.com/in/smotek/"
    },
    {
      name: "Jamie Tech",
      role: "Lead Engineer",
      image: "/assets/generated_images/engineer_mr_props.png",
      linkedin: "#"
    },
    {
      name: "Taylor Design",
      role: "Head of Product",
      image: "/assets/generated_images/designer_mr_props.png",
      linkedin: "#"
    }
  ];

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Meet the Team</h2>
          <p className="text-muted-foreground text-lg">
            The experts behind the platform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {team.map((member, i) => (
            <div key={i} className="text-center group">
              <div className="relative mb-4 inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-2 border-background hover:bg-primary/90 transition-colors">
                   <ExternalLink className="h-4 w-4 text-white" />
                </a>
              </div>
              <h3 className="font-display text-xl font-bold">{member.name}</h3>
              <p className="text-primary font-medium text-sm mb-3">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
