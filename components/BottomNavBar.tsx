import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { HomeIcon } from './icons/HomeIcon';
import { NotificationIcon } from './icons/NotificationIcon';
import { ProfileIcon } from './icons/ProfileIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { useAppContext } from '../context/AppContext';

export const BottomNavBar: React.FC = () => {
    const { currentUser, activeRoundId } = useAppContext();
    const location = useLocation();
    const activeLinkClass = "text-blue-600";
    const inactiveLinkClass = "text-gray-500 hover:text-gray-800";
    
    // Hide the nav bar during an active round
    if (location.pathname.startsWith('/round/')) {
        return null;
    }
    
    const NavItem: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => (
        <NavLink to={to} className={({ isActive }) => `${isActive ? activeLinkClass : inactiveLinkClass} flex flex-col items-center justify-center gap-1 w-full pt-2`}>
            {children}
        </NavLink>
    );

    const showPlayButton = location.pathname === '/' || location.pathname.startsWith('/competitions');

    return (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-24 z-50">
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-t-lg">
                <div className="grid grid-cols-5 h-full items-center">
                    <NavItem to="/">
                        <HomeIcon className="h-6 w-6" />
                        <span className="text-xs font-medium">Home</span>
                    </NavItem>
                    <NavItem to="/competitions">
                        <TrophyIcon className="h-6 w-6" />
                        <span className="text-xs font-medium">Competitions</span>
                    </NavItem>
                    
                    {/* Placeholder for the large central button */}
                    <div />

                    <NavItem to="/notifications">
                        <div className="relative">
                            <NotificationIcon className="h-6 w-6" />
                            {/* Red dot for notification */}
                            <span className="absolute top-0 right-0 block h-2 w-2 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-2 ring-white" />
                        </div>
                        <span className="text-xs font-medium">Alerts</span>
                    </NavItem>
                    <NavItem to={`/profile/${currentUser?.id}`}>
                        <ProfileIcon className="h-6 w-6" />
                        <span className="text-xs font-medium">Profile</span>
                    </NavItem>
                </div>
            </div>

            {showPlayButton && (
                activeRoundId ? (
                    <Link 
                        to={`/round/${activeRoundId}`}
                        className="absolute left-1/2 -translate-x-1/2 top-0 h-16 w-36 bg-blue-600 text-white rounded-full flex items-center justify-center text-center shadow-lg border-4 border-white hover:bg-blue-700 transition transform hover:scale-105"
                    >
                        <span className="font-bold text-base leading-tight">Return to Round</span>
                    </Link>
                ) : (
                    <Link 
                        to="/select-competition"
                        className="absolute left-1/2 -translate-x-1/2 top-2 h-14 w-28 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-green-700 transition transform hover:scale-105"
                    >
                        <span className="font-bold text-lg tracking-wide">Play</span>
                    </Link>
                )
            )}
        </div>
    );
};