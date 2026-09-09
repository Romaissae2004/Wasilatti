import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';

const DEFAULT_TESTIMONIALS = [
  {
    id: 1,
    quote: "Wasilatti a changé ma façon de commander. La livraison est toujours rapide et les livreurs sont super sympas. Je recommande à 100% !",
    name: "Karim Benali",
    role: "Client régulier",
    avatar: "https://i.pravatar.cc/150?img=11",
    rating: 5,
    delay: "0s"
  },
  {
    id: 2,
    quote: "Grâce à Wasilatti, nous avons augmenté nos ventes de 40%. La plateforme est intuitive et le support client est excellent.",
    name: "Samira Alaoui",
    role: "Propriétaire PharmaDirect",
    avatar: "https://i.pravatar.cc/150?img=5",
    rating: 5,
    delay: "0.15s"
  },
  {
    id: 3,
    quote: "Le suivi en temps réel est incroyable. Je peux voir exactement où est mon livreur et quand il arrivera. Très pratique !",
    name: "Youssef Marrakchi",
    role: "Client premium",
    avatar: "https://i.pravatar.cc/150?img=3",
    rating: 5,
    delay: "0.3s"
  }
];

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await axios.get('/api/evaluations/public');
        const data = response.data?.data ?? response.data ?? [];
        if (data && data.length > 0) {
          const mapped = data.map((item, index) => {
            // Prettify name (e.g. karim_benali -> Karim Benali)
            const formattedName = item.clientUsername
              ? item.clientUsername
                  .split(/[_-]/)
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
              : 'Client';

            const avatarIndex = (index % 10) + 1;
            const avatarUrl = `https://i.pravatar.cc/150?img=${avatarIndex}`;

            return {
              id: item.id,
              quote: item.comment,
              name: formattedName,
              role: item.driverName ? `Livré par ${item.driverName}` : 'Client certifié',
              avatar: avatarUrl,
              rating: item.rating || 5,
              delay: `${index * 0.15}s`
            };
          });
          setTestimonials(mapped);
        }
      } catch (error) {
        console.error("Error fetching public reviews:", error);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <section id="testimonials" className="py-24 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 scroll-reveal active">
          <span className="text-wasilatti-orange font-semibold text-sm uppercase tracking-widest">Témoignages</span>
          <h2 className="text-4xl lg:text-5xl font-display font-black text-gray-900 dark:text-white mt-3">
            Ils nous<br />
            <span className="text-gradient">font confiance</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map(item => (
            <div 
              key={item.id}
              className="testimonial-card relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(8,145,178,0.1)] transition-all duration-300 border border-gray-100 dark:border-slate-700 scroll-reveal active flex flex-col"
              style={{ transitionDelay: item.delay }}
            >
              <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-wasilatti-blue to-wasilatti-blueLight rounded-full flex items-center justify-center text-white text-xl shadow-lg shadow-wasilatti-blue/30">
                <i className="fas fa-quote-left"></i>
              </div>
              
              <div className="flex items-center gap-1 mb-5 mt-2">
                {[...Array(5)].map((_, i) => (
                  <i 
                    key={i} 
                    className={`fas fa-star text-sm drop-shadow-sm ${
                      i < (item.rating || 5) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  ></i>
                ))}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8 text-base font-medium italic">
                "{item.quote}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto border-t border-gray-100 dark:border-slate-700 pt-6">
                <img 
                  src={item.avatar} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md" 
                  alt={item.name} 
                />
                <div>
                  <p className="font-extrabold text-base text-gray-800 dark:text-white">{item.name}</p>
                  <p className="text-xs font-bold text-wasilatti-blue uppercase tracking-wider">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
