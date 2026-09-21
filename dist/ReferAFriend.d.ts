import React from 'react';
import { ReferralStrings } from './referralStrings';
export type ReferAFriendProps = {
    visible: boolean;
    onClose: () => void;
    email?: string;
    name?: string;
    appUserId?: string;
    playPurchaseToken?: string;
    shareMessage?: string;
    primaryColor?: string;
    headline?: string;
    rewardText?: string;
    strings?: Partial<ReferralStrings>;
};
declare const ReferAFriend: React.FC<ReferAFriendProps>;
export default ReferAFriend;
