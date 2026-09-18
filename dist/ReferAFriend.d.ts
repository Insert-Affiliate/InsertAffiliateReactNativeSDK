import React from 'react';
export type ReferAFriendProps = {
    visible: boolean;
    onClose: () => void;
    email?: string;
    name?: string;
    shareMessage?: string;
    primaryColor?: string;
    headline?: string;
    rewardText?: string;
};
declare const ReferAFriend: React.FC<ReferAFriendProps>;
export default ReferAFriend;
