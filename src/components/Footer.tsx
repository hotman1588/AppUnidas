import { Heart, Mail, Phone, MapPin, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-unidas-dark text-white/50 pt-24 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-unidas-primary rounded-xl flex items-center justify-center text-white">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-display font-black tracking-tighter text-white">Unidas</span>
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none">BARRIOS UNIDOS</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-8 font-medium">
              Plataforma de acompañamiento institucional para reconocer, caracterizar y empoderar a las mujeres cuidadoras de Barrios Unidos.
            </p>
            <div className="flex items-center space-x-2 text-unidas-primary font-bold text-xs uppercase tracking-widest">
              <Heart className="w-4 h-4 fill-current" />
              <span>Cuidamos a quienes cuidan</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6">Enlaces Rápidos</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-unidas-primary transition-colors">Sobre el Programa</a></li>
              <li><a href="#" className="hover:text-unidas-primary transition-colors">Cursos y Talleres</a></li>
              <li><a href="#" className="hover:text-unidas-primary transition-colors">Noticias</a></li>
              <li><a href="#" className="hover:text-unidas-primary transition-colors">Preguntas Frecuentes</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6">Contacto</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-unidas-primary" />
                <span>Barrios Unidos, Bogotá D.C.</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-unidas-primary" />
                <span>(601) 123 4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-unidas-primary" />
                <span>contacto@unidas.social</span>
              </li>
            </ul>
          </div>

          {/* Institutional */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-6">Institucional</h4>
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
              <div className="flex items-center space-x-3 mb-4 text-sm font-bold text-white">
                <Globe className="w-5 h-5 text-unidas-primary" />
                <span>Sitios Oficiales</span>
              </div>
              <ul className="space-y-3 text-xs">
                <li><a href="https://www.barriosunidos.gov.co/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Alcaldía Local</a></li>
                <li><a href="https://www.sdmujer.gov.co/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Secretaría de la Mujer</a></li>
                <li><a href="https://www.integracionsocial.gov.co/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Integración Social</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2024 UNIDAS - Barrios Unidos. Todos los derechos reservados.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-300">Términos y Condiciones</a>
            <a href="#" className="hover:text-slate-300">Política de Privacidad</a>
            <a href="#" className="hover:text-slate-300">Habeas Data</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
