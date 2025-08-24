

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Competition, CompetitionFeedItem } from '../types';

// Icons
const HeartIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFilled ? 'currentColor' : 'none'} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
);

const CommentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

interface FeedItemCardProps {
    item: CompetitionFeedItem;
    competition: Competition;
}

export const FeedItemCard: React.FC<FeedItemCardProps> = ({ item, competition }) => {
    const { updateCompetitionFeedItem } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(item.likes || 0);

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newIsLiked = !isLiked;
        const newLikeCount = newIsLiked ? likeCount + 1 : likeCount - 1;
        setIsLiked(newIsLiked);
        setLikeCount(newLikeCount);
        updateCompetitionFeedItem(competition.id, item.id, { likes: newLikeCount });
    };
    
    const renderContent = () => {
        switch (item.type) {
            case 'comment':
                return <p className="text-gray-800 text-sm whitespace-pre-wrap">{item.text}</p>;
            case 'video':
                return (
                    <div className="w-full mt-2 aspect-video bg-gray-900 flex items-center justify-center rounded-lg overflow-hidden relative">
                        <video src={item.videoUrl} controls className="w-full h-full object-contain"></video>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            Highlight from Hole {item.hole}
                        </div>
                    </div>
                );
            case 'photo':
                 return (
                    <div className="w-full mt-2 aspect-video bg-gray-200 flex items-center justify-center rounded-lg overflow-hidden relative">
                        <img src={item.photoUrl} alt={`Photo from hole ${item.hole}`} className="w-full h-full object-contain bg-black" />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            Photo from Hole {item.hole}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Link to={`/competitions/${competition.id}`} state={{ defaultTab: 'feed' }} className="block">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 flex items-center gap-3">
                    <img src={item.userProfilePictureUrl} alt={item.userName} className="w-10 h-10 rounded-full object-cover"/>
                    <div>
                        <p className="font-semibold text-gray-800">{item.userName}</p>
                        <p className="text-xs text-gray-500">
                           posted in <span className="font-medium text-gray-700">{competition.name}</span>
                        </p>
                    </div>
                </div>

                <div className="px-4 pb-4">
                    {renderContent()}
                </div>

                {/* Interaction Bar */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-200">
                    <button onClick={handleLike} className="flex items-center gap-1.5 text-gray-600 hover:text-red-500">
                        <HeartIcon className={`h-6 w-6 ${isLiked ? 'text-red-500' : ''}`} isFilled={isLiked} />
                        <span className="font-semibold text-sm">{likeCount}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <CommentIcon className="h-6 w-6" />
                        <span className="font-semibold text-sm">{competition.feed?.length || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};