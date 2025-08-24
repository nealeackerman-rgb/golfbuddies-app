
import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { RoundCard } from '../components/RoundCard';
import { FeedItemCard } from '../components/FeedItemCard';
import { Competition, CompetitionFeedItem, Round } from '../types';

type AggregatedFeedItem = 
    | { type: 'round_summary'; data: Round; timestamp: string }
    | { type: 'competition_post'; data: CompetitionFeedItem; competition: Competition; timestamp: string };

export const Feed: React.FC = () => {
    const { rounds, competitions } = useAppContext();

    const aggregatedFeed = useMemo(() => {
        const feedItems: AggregatedFeedItem[] = [];

        // Add completed rounds with summaries
        rounds.forEach(round => {
            if (round.aiSummary) {
                feedItems.push({ type: 'round_summary', data: round, timestamp: round.date });
            }
        });

        // Add individual competition feed items (comments, videos)
        competitions.forEach(competition => {
            if (competition.feed) {
                competition.feed.forEach(item => {
                    feedItems.push({ type: 'competition_post', data: item, competition, timestamp: item.timestamp });
                });
            }
        });

        // Sort all items by timestamp, newest first
        return feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    }, [rounds, competitions]);

    return (
        <Layout>
            <div className="space-y-4">
                {aggregatedFeed.length === 0 && (
                    <div className="text-center text-gray-500 bg-gray-100 p-8 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-700">Welcome to GolfBuddies!</h2>
                        <p className="mt-2">The feed is quiet right now. Start a competition or post a comment to get things going!</p>
                    </div>
                )}
                {aggregatedFeed.map((item, index) => {
                    if (item.type === 'round_summary') {
                        return <RoundCard key={`round-${item.data.id}-${index}`} round={item.data} />;
                    }
                    if (item.type === 'competition_post') {
                        return <FeedItemCard key={`post-${item.data.id}-${index}`} item={item.data} competition={item.competition} />;
                    }
                    return null;
                })}
            </div>
        </Layout>
    );
};