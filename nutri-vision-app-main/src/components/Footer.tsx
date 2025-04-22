
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 py-12 mt-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-nutri-green to-nutri-blue-light flex items-center justify-center">
                <span className="text-white font-bold text-sm">NV</span>
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-nutri-green to-nutri-blue">
                Nutri-Vision
              </span>
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              Personalized diet recommendations based on your available ingredients,
              dietary preferences, and health goals.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
            <ul className="space-y-2">
              <li><Link to="/recipes" className="text-gray-600 hover:text-nutri-green">Recipe Finder</Link></li>
              <li><Link to="/dashboard" className="text-gray-600 hover:text-nutri-green">Nutrition Dashboard</Link></li>
              <li><Link to="/profile" className="text-gray-600 hover:text-nutri-green">Profile Settings</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-nutri-green">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-nutri-green">Help Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-nutri-green">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Nutri-Vision. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-nutri-green">
              Terms
            </a>
            <a href="#" className="text-gray-500 hover:text-nutri-green">
              Privacy
            </a>
            <a href="#" className="text-gray-500 hover:text-nutri-green">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
