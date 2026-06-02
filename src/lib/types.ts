import { Timestamp } from 'firebase/firestore';

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface TVCommand {
  command: "play" | "pause" | "resume" | "restart" | "resync" | "standby" | "wake" | "reload" | "fullscreen" | "mute" | "emergency" | "clear_emergency";
  commandId: string;
  createdAt: number;
  createdBy: string;
  scope?: "store" | "device" | "region";
  payload?: any;
}

export interface Store {
  id: string;
  name: string;
  location?: string;
  state: string;
  regionId: string;
  internalCode?: string;
  retailer?: string;
  city?: string;
  address?: string;
  screenCount?: number;
  dailyTraffic?: number;
  estimatedImpressions?: number;
  responsible?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'maintenance';
  operatingHours?: OperatingHours;
  tvCommand?: TVCommand; // Mando a nivel tienda
}

export interface Region {
  id: string;
  name: string;
  states: string[];
  totalStores?: number;
  totalScreens?: number;
  estimatedTraffic?: number;
  activeCampaigns?: number;
  updatedAt?: number;
  nextDayVideoStatus?: 'ready' | 'pending' | 'generating' | 'error';
  lastGeneratedAt?: number;
  enabled: boolean;
  playbackStart: string;
  playbackEnd: string;
  timezone: string;
  standbyImage: string;
  standbyImageUrl?: string;
  autoResume: boolean;
  tvCommand?: TVCommand; // Mando regional (Legacy/Scheduling)
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  negotiatedCPM: number;
  totalBudget: number;
  notes?: string;
  createdAt: number;
  isInternal?: boolean;
}

export type ContentType = 'video' | 'image';
export type ConnectionStatus = 'active' | 'error' | 'disconnected';

export interface CurrentContent {
  type: 'media' | 'campaign' | 'playlist';
  id: string;
  assignedAt: number;
  url?: string;
}

export interface TodayStats {
    totalPlaybacks: number;
    lastPlaybackTime: number | null;
}

export interface Device {
  id: string;
  name: string;
  storeId: string;
  regionId?: string;
  currentRegionId?: string;
  status: 'online' | 'offline';
  lastHeartbeat: number;
  currentContent: CurrentContent | null;
  currentPlaylistId?: string;
  playbackMode?: 'standalone' | 'regional-merged' | 'standby' | 'emergency';
  connectionStatus: ConnectionStatus;
  errorMessage?: string;
  todayStats: TodayStats;
  resolution?: string;
  orientation?: 'landscape' | 'portrait';
  tags?: string[];
  lastSeenUrl?: string;
  updatedAt?: number;
  // Remote Control Tracking
  tvCommand?: TVCommand; // Mando individual
  lastCommandReceived?: string;
  lastCommandScope?: "store" | "device" | "region";
  lastCommandExecutedAt?: number;
  lastCommandStatus?: 'success' | 'error';
  lastCommandError?: string;
  currentOffset?: number;
  driftSeconds?: number;
}

export type MediaStatus = 'active' | 'archived' | 'pending' | 'error' | 'approved';

export interface Media {
  id: string;
  title: string;
  fileName: string;
  downloadURL: string;
  sponsorId: string;
  sponsorName: string;
  duration: number;
  status: MediaStatus;
  approved?: boolean;
  active?: boolean;
  createdAt: Timestamp | Date | number;
  storagePath?: string;
  type: ContentType;
  allowedRegions?: string[];
  tags?: string[];
  validityStart?: number;
  validityEnd?: number;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';

export interface Campaign {
    id: string;
    name: string;
    sponsorId: string;
    brandName: string;
    mediaIds: string[];
    startDate: Timestamp | Date;
    endDate: Timestamp | Date;
    targetRegions: string[];
    targetStores?: string[];
    targetScreens?: string[];
    status: CampaignStatus;
    targetImpressions: number;
    deliveredImpressions: number;
    targetPlaybacks: number;
    deliveredPlaybacks: number;
    cpm: number;
    budget: number;
    priority: 'high' | 'normal' | 'low';
    createdAt: number;
    updatedAt: number;
}

export interface PlaybackLog {
    id: string;
    timestamp: Timestamp | Date;
    deviceId: string;
    storeId: string;
    mediaId: string;
    campaignId: string | null;
    eventType: 'start' | 'complete' | 'interrupted';
}

export interface PlaylistItem {
  mediaId: string;
  title: string;
  sponsorId: string;
  sponsorName: string;
  downloadURL: string;
  duration: number;
  type: ContentType;
  isFiller: boolean;
  campaignId?: string;
  source: 'campaign' | 'coppel_internal';
}

export interface GeneratedPlaylist {
    id: string;
    regionId: string;
    regionName: string;
    date: string;
    status: 'pending_merge' | 'generating' | 'ready' | 'failed' | 'failed_empty_playlist';
    mergedVideoUrl: string;
    mergedDuration: number;
    syncStartTime: number;
    version: number;
    storagePath: string;
    totalSlots: number;
    paidSlots: number;
    fillerSlots: number;
    occupancy: number;
    campaignsIncluded: string[];
    mediaIncluded: string[];
    playlistItems: PlaylistItem[]; 
    createdAt: number;
    updatedAt: number;
    triggeredBy: string;
    errorMessage?: string;
    requestedAt?: number;
}

export interface GlobalPlayback {
  syncState: 'playing' | 'countdown' | 'paused';
  scheduledStartTime?: number;
  syncStartTime?: number;
  currentVersion: number;
  updatedAt: number;
  mode: 'playlist' | 'merged' | 'pending-merge';
  mergedVideoURL?: string;
  mergedDuration?: number;
  interLoopDelayMs?: number;
  regionConfigs?: {
    [regionId: string]: {
      currentVideoURL: string;
      version: number;
      refreshRequestedAt?: number;
      status?: 'ready' | 'pending' | 'generating' | 'pending_merge';
      currentPlaylistId?: string;
    }
  }
}
