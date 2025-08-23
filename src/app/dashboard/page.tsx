'use client';
import React from "react";
import Sidebar from "@/Components/dashboard/Sidebar";
import Header from "@/Components/dashboard/Header";
import CardCarousel from "@/Components/dashboard/CardCrousal";
import ProgressionHubBanner from "@/Components/dashboard/ProgressionHubBanner";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Vault ,db} from "@/lib/database";
import { useEffect, useState } from "react";
import { TaskPopup } from "@/util/TaskPopupProps";

const Dashboard = () => {
   const router = useRouter();
    const { isConnected, address } = useAccount();
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
    const [showTaskPopup, setShowTaskPopup] = useState(false);

    // Fetch vaults from database
    useEffect(() => {
        const fetchVaults = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedVaults = await db.getAllVaults();
                setVaults(fetchedVaults);
                console.log('Fetched vaults:', fetchedVaults);
            } catch (err) {
                console.error('Error fetching vaults:', err);
                setError('Failed to load vaults');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVaults();
    }, []);

    const handleVaultClick = (vaultId: number) => {
        router.push(`/vaults/verification?id=${vaultId}`);
    };

    const handleChatClick = (vault: Vault) => {
        if (!address) return;
        
        // Check if vault has any social links to show tasks for
        const hasXProfile = !!vault.sponsor_links?.x_profile;
        const hasAnnouncementTweet = !!vault.sponsor_links?.announcement_tweet;
        
        // If no social links at all, go directly to chat
        if (!hasXProfile && !hasAnnouncementTweet) {
            router.push(`/trovio-chat?vaultId=${vault.id}`);
            return;
        }
        
        // Check if user has already completed available tasks for this vault
        const savedStatus = localStorage.getItem(`vault_${vault.id}_tasks_${address}`);
        if (savedStatus) {
            const taskStatus = JSON.parse(savedStatus);
            const followCompleted = !hasXProfile || taskStatus.followed;
            const retweetCompleted = !hasAnnouncementTweet || taskStatus.retweeted;
            
            // If all available tasks are completed, go directly to chat
            if (followCompleted && retweetCompleted) {
                router.push(`/trovio-chat?vaultId=${vault.id}`);
                return;
            }
        }
        
        // Show task popup for incomplete tasks
        setSelectedVault(vault);
        setShowTaskPopup(true);
    };

    const formatSponsorAddress = (address: string) => {
        if (!address) return 'Unknown';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };
  return (
    <div className="min-h-screen flex flex-row bg-black">
      <Sidebar />
      <main className="flex-1 overflow-hidden mr-4 mt-4">
        <Header />

        <ProgressionHubBanner />

        <CardCarousel vaults={vaults} onHandleChat={handleChatClick}/>
      </main>
       {showTaskPopup && selectedVault && (
                    <TaskPopup
                        vault={selectedVault}
                        onClose={() => {
                            setShowTaskPopup(false);
                            setSelectedVault(null);
                        }}
                        onProceedToChat={() => {
                            setShowTaskPopup(false);
                            router.push(`/trovio-chat?vaultId=${selectedVault.id}`);
                            setSelectedVault(null);
                        }}
                    />
                )}
    </div>
  );
};

export default Dashboard;
