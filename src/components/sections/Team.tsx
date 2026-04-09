import { ExternalLink } from "lucide-react";

const team = [
  {
    name: "Helvis Schmotex",
    role: "Founder",
    image: "/assets/Helvis_Smoteks_profile_photo_1766935918595.png",
    linkedin: "https://www.linkedin.com/in/smotek/",
  },
  {
    name: "Jamie Tech",
    role: "Lead Engineer",
    image: "/assets/generated_images/mr_props_engineer_mascot.png",
    linkedin: "#",
  },
  {
    name: "Taylor Design",
    role: "Head of Product",
    image: "/assets/generated_images/mr_props_designer_mascot.png",
    linkedin: "#",
  },
];

export function Team() {
  return (
    <section className="bg-secondary/30 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold md:text-5xl mb-4">Meet the Team</h2>
          <p className="text-lg text-muted-foreground">The experts behind the platform.</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {team.map((member) => (
            <div key={member.name} className="group text-center">
              <div className="relative mb-4 inline-block">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-background shadow-xl transition-transform duration-300 group-hover:scale-105">
                  <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                </div>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 right-0 rounded-full bg-primary p-2 border-2 border-background transition-colors hover:bg-primary/90">
                  <ExternalLink className="h-4 w-4 text-white" />
                </a>
              </div>
              <h3 className="font-display text-xl font-bold">{member.name}</h3>
              <p className="mb-3 text-sm font-medium text-primary">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
