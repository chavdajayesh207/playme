/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Track } from '../types';
import { searchLiveMusicEvents, searchYoutubeMusic, getYoutubeApiKey } from '../lib/youtube';
import { ScrollContainer } from './ScrollContainer';
import { MusicHubView } from './MusicHubView';
import {
  Search,
  Radio,
  Play,
  Loader2,
  Heart,
  Sparkles,
  Tv,
  Compass,
  Layers,
  X,
  Briefcase,
  Cpu,
  Coins,
  Brain,
  Flame,
  BookOpen,
  Newspaper,
  Trophy,
  Film,
  Globe,
  Award,
  MapPin,
  Music2,
  Headphones,
  Disc3,
  Guitar,
  Mic2
} from 'lucide-react';

interface PodcastHost {
  name: string;
  initials: string;
  gradient: string;
  handle: string;
  fallbackSubscribers: string;
  dpUrl?: string;
  isCustom?: boolean;
  searchQueryOverride?: string;
}

const TOP_HOSTS: PodcastHost[] = [
  { name: 'Warren Buffett', initials: 'WB', gradient: 'from-blue-800 to-slate-900', handle: '@warrenbuffett', fallbackSubscribers: '3.5M', searchQueryOverride: 'Warren Buffett investing letters finance' },
  { name: 'Nikhil Kamath', initials: 'NK', gradient: 'from-emerald-700 to-teal-600', handle: '@nikhil.kamath', fallbackSubscribers: '1.4M', searchQueryOverride: 'Nikhil Kamath WTF is podcast entrepreneur' },
  { name: 'CA Rachana Ranade', initials: 'RR', gradient: 'from-pink-700 to-pink-950', handle: '@carachanaranade', fallbackSubscribers: '4.8M', searchQueryOverride: 'CA Rachana Ranade stock market lectures for beginners' },
  { name: 'Ray Dalio', initials: 'RD', gradient: 'from-red-900 to-red-950', handle: '@raydalio', fallbackSubscribers: '1.8M', searchQueryOverride: 'Ray Dalio principles economy investing' },
  { name: 'Mark Minervini', initials: 'MM', gradient: 'from-rose-900 to-rose-950', handle: '@markminervini', fallbackSubscribers: '400K', searchQueryOverride: 'Mark Minervini trading stocks VCP pattern' },
  { name: 'Ranveer Allahbadia', initials: 'RA', gradient: 'from-red-700 to-rose-600', handle: '@beerbiceps', fallbackSubscribers: '11.1M' }
];

const GLOBAL_HOSTS: PodcastHost[] = [
  { name: 'Warren Buffett', initials: 'WB', gradient: 'from-blue-800 to-slate-900', handle: '@warrenbuffett', fallbackSubscribers: '3M', searchQueryOverride: 'Warren Buffett investing letters finance' },
  { name: 'Charlie Munger', initials: 'CM', gradient: 'from-amber-800 to-slate-950', handle: '@charliemunger', fallbackSubscribers: '2M', searchQueryOverride: 'Charlie Munger wisdom investing poor charlie' },
  { name: 'Peter Lynch', initials: 'PL', gradient: 'from-slate-700 to-stone-900', handle: '@peterlynch', fallbackSubscribers: '1M', searchQueryOverride: 'Peter Lynch investing stock market' },
  { name: 'Benjamin Graham', initials: 'BG', gradient: 'from-zinc-800 to-zinc-950', handle: '@benjamingraham', fallbackSubscribers: '500K', searchQueryOverride: 'Benjamin Graham intelligent investor value investing' },
  { name: 'Ray Dalio', initials: 'RD', gradient: 'from-red-900 to-red-950', handle: '@raydalio', fallbackSubscribers: '1.8M', searchQueryOverride: 'Ray Dalio principles economy investing' },
  { name: 'George Soros', initials: 'GS', gradient: 'from-stone-800 to-stone-950', handle: '@georgesoros', fallbackSubscribers: '400K', searchQueryOverride: 'George Soros reflexivity finance market open society' },
  { name: 'Howard Marks', initials: 'HM', gradient: 'from-emerald-900 to-teal-950', handle: '@howardmarks', fallbackSubscribers: '600K', searchQueryOverride: 'Howard Marks oak tree capital memos investing' },
  { name: 'Mohnish Pabrai', initials: 'MP', gradient: 'from-teal-800 to-cyan-950', handle: '@mohnishpabrai', fallbackSubscribers: '450K', searchQueryOverride: 'Mohnish Pabrai value investing dhandho' },
  { name: 'Li Lu', initials: 'LL', gradient: 'from-indigo-900 to-indigo-950', handle: '@lilu', fallbackSubscribers: '150K', searchQueryOverride: 'Li Lu himalaya capital value investing' },
  { name: 'Jesse Livermore', initials: 'JL', gradient: 'from-slate-900 to-zinc-950', handle: '@jesselivermore', fallbackSubscribers: '200K', searchQueryOverride: 'Jesse Livermore stock trader biography market secrets' },
  { name: 'Paul Tudor Jones', initials: 'PJ', gradient: 'from-blue-900 to-indigo-950', handle: '@paultudorjones', fallbackSubscribers: '300K', searchQueryOverride: 'Paul Tudor Jones macro trading market wizards' },
  { name: 'Stanley Druckenmiller', initials: 'SD', gradient: 'from-purple-900 to-violet-950', handle: '@stanleydruckenmiller', fallbackSubscribers: '500K', searchQueryOverride: 'Stanley Druckenmiller investing trading macro' },
  { name: 'Ed Seykota', initials: 'ES', gradient: 'from-emerald-900 to-green-950', handle: '@edseykota', fallbackSubscribers: '100K', searchQueryOverride: 'Ed Seykota trend following trading systems' },
  { name: 'Richard Dennis', initials: 'RD', gradient: 'from-orange-900 to-orange-950', handle: '@richarddennis', fallbackSubscribers: '120K', searchQueryOverride: 'Richard Dennis turtle trading experiment turtle traders' },
  { name: 'Mark Minervini', initials: 'MM', gradient: 'from-rose-900 to-rose-950', handle: '@markminervini', fallbackSubscribers: '400K', searchQueryOverride: 'Mark Minervini trading stocks VCP pattern' },
  { name: 'William O\'Neil', initials: 'WO', gradient: 'from-lime-900 to-lime-950', handle: '@williamoneil', fallbackSubscribers: '250K', searchQueryOverride: 'William O\'Neil CANSLIM stock investing trading' },
  { name: 'Nicolas Darvas', initials: 'ND', gradient: 'from-fuchsia-900 to-fuchsia-950', handle: '@nicolasdarvas', fallbackSubscribers: '80K', searchQueryOverride: 'Nicolas Darvas box theory how i made 2 million' },
  { name: 'Larry Williams', initials: 'LW', gradient: 'from-amber-900 to-amber-950', handle: '@larrywilliams', fallbackSubscribers: '180K', searchQueryOverride: 'Larry Williams futures trading indicators' },
  { name: 'Bruce Kovner', initials: 'BK', gradient: 'from-neutral-800 to-neutral-950', handle: '@brucekovner', fallbackSubscribers: '90K', searchQueryOverride: 'Bruce Kovner trading interview' },
  { name: 'Patrick Boyle', initials: 'PB', gradient: 'from-sky-900 to-sky-950', handle: '@patrickboyleonfinance', fallbackSubscribers: '600K', searchQueryOverride: 'Patrick Boyle on Finance hedge funds' },
  { name: 'Joseph Carlson', initials: 'JC', gradient: 'from-blue-700 to-slate-900', handle: '@josephcarlsonshow', fallbackSubscribers: '450K', searchQueryOverride: 'Joseph Carlson Show dividend growth investing' },
  { name: 'Ben Felix', initials: 'BF', gradient: 'from-zinc-700 to-zinc-900', handle: '@benfelix', fallbackSubscribers: '550K', searchQueryOverride: 'Ben Felix rational reminder index funds' },
  { name: 'Sven Carlin', initials: 'SC', gradient: 'from-stone-700 to-stone-900', handle: '@svencarlin', fallbackSubscribers: '300K', searchQueryOverride: 'Sven Carlin value investing platform' },
  { name: 'Adam Khoo', initials: 'AK', gradient: 'from-cyan-800 to-teal-900', handle: '@adamkhoo', fallbackSubscribers: '1.2M', searchQueryOverride: 'Adam Khoo stock trading investing options' },
  { name: 'Patrick O\'Shaughnessy', initials: 'PO', gradient: 'from-indigo-800 to-purple-900', handle: '@patrick_oshag', fallbackSubscribers: '180K', searchQueryOverride: 'Patrick O\'Shaughnessy invest like the best' },
  { name: 'Meb Faber', initials: 'MF', gradient: 'from-slate-700 to-neutral-800', handle: '@mebfaber', fallbackSubscribers: '120K', searchQueryOverride: 'Meb Faber show investing quant' },
  { name: 'Joe Rogan', initials: 'JR', gradient: 'from-orange-700 to-red-600', handle: '@joerogan', fallbackSubscribers: '16.6M' },
  { name: 'Steven Bartlett', initials: 'SB', gradient: 'from-amber-700 to-yellow-600', handle: '@stevenbartlett', fallbackSubscribers: '6.4M' },
  { name: 'Lex Fridman', initials: 'LF', gradient: 'from-slate-700 to-zinc-900', handle: '@lexfridman', fallbackSubscribers: '4.2M' },
  { name: 'Tim Ferriss', initials: 'TF', gradient: 'from-sky-700 to-blue-600', handle: '@timferriss', fallbackSubscribers: '1.4M' },
  { name: 'Andrew Huberman', initials: 'AH', gradient: 'from-indigo-700 to-purple-600', handle: '@hubermanlab', fallbackSubscribers: '5.6M' },
  { name: 'Patrick Bet-David', initials: 'PB', gradient: 'from-zinc-700 to-neutral-800', handle: '@valuetainment', fallbackSubscribers: '5.3M' },
  { name: 'Chris Williamson', initials: 'CW', gradient: 'from-fuchsia-700 to-pink-600', handle: '@chriswilliamson', fallbackSubscribers: '2.4M' },
  { name: 'Lewis Howes', initials: 'LH', gradient: 'from-teal-700 to-emerald-600', handle: '@lewishowes', fallbackSubscribers: '4.1M' },
  { name: 'Rich Roll', initials: 'RR', gradient: 'from-green-700 to-lime-600', handle: '@richroll', fallbackSubscribers: '1.2M' },
  { name: 'Peter Attia', initials: 'PA', gradient: 'from-violet-700 to-indigo-600', handle: '@peterattia', fallbackSubscribers: '650K' },
  { name: 'Jordan Peterson', initials: 'JP', gradient: 'from-red-800 to-orange-700', handle: '@jordanpeterson', fallbackSubscribers: '8.1M' },
  { name: 'Tom Bilyeu', initials: 'TB', gradient: 'from-rose-700 to-pink-600', handle: '@tombilyeu', fallbackSubscribers: '4.5M' },
  { name: 'Gary Vaynerchuk', initials: 'GV', gradient: 'from-yellow-700 to-amber-600', handle: '@garyvee', fallbackSubscribers: '4.4M' }
];

const INDIAN_HOSTS: PodcastHost[] = [
  { name: 'Pranjal Kamra', initials: 'PK', gradient: 'from-emerald-700 to-emerald-950', handle: '@pranjalkamra', fallbackSubscribers: '5.8M', searchQueryOverride: 'Pranjal Kamra stock market mutual funds basic investing' },
  { name: 'CA Rachana Ranade', initials: 'RR', gradient: 'from-pink-700 to-pink-950', handle: '@carachanaranade', fallbackSubscribers: '4.8M', searchQueryOverride: 'CA Rachana Ranade stock market lectures for beginners' },
  { name: 'Akshat Shrivastava', initials: 'AS', gradient: 'from-red-800 to-stone-900', handle: '@akshatshrivastava', fallbackSubscribers: '1.9M', searchQueryOverride: 'Akshat Shrivastava personal finance investing gold real estate' },
  { name: 'Vivek Bajaj', initials: 'VB', gradient: 'from-cyan-700 to-cyan-950', handle: '@vivekbajaj', fallbackSubscribers: '1.6M', searchQueryOverride: 'Vivek Bajaj stock market elearnmarkets learn2trade' },
  { name: 'Subasish Pani', initials: 'SP', gradient: 'from-blue-700 to-indigo-950', handle: '@powerofstocks', fallbackSubscribers: '1.9M', searchQueryOverride: 'Subasish Pani Power of Stocks price action trading' },
  { name: 'Anish Singh Thakur', initials: 'AT', gradient: 'from-indigo-700 to-violet-950', handle: '@boomingbulls', fallbackSubscribers: '1.5M', searchQueryOverride: 'Anish Singh Thakur Booming Bulls stock market trading' },
  { name: 'Asset Yogi', initials: 'AY', gradient: 'from-yellow-800 to-amber-950', handle: '@assetyogi', fallbackSubscribers: '4.1M', searchQueryOverride: 'Asset Yogi personal finance real estate mutual funds tax' },
  { name: 'Sunil Minglani', initials: 'SM', gradient: 'from-orange-800 to-orange-950', handle: '@sunilminglani', fallbackSubscribers: '3.1M', searchQueryOverride: 'Sunil Minglani stock market psychology chart reading' },
  { name: 'Ghanshyam Yadav', initials: 'GY', gradient: 'from-green-800 to-green-950', handle: '@ghanshyamtech', fallbackSubscribers: '2.5M', searchQueryOverride: 'Ghanshyam Yadav Ghanshyam Tech bank nifty option trading' },
  { name: 'Nitin Bhatia', initials: 'NB', gradient: 'from-slate-700 to-slate-900', handle: '@nitinbhatia', fallbackSubscribers: '1.2M', searchQueryOverride: 'Nitin Bhatia stock market real estate home loan' },
  { name: 'Pushkar Raj Thakur', initials: 'PT', gradient: 'from-rose-800 to-pink-950', handle: '@pushkarrajthakur', fallbackSubscribers: '10.2M', searchQueryOverride: 'Pushkar Raj Thakur business trading network marketing' },
  { name: 'Neeraj Joshi', initials: 'NJ', gradient: 'from-teal-600 to-teal-900', handle: '@neerajjoshi', fallbackSubscribers: '1.9M', searchQueryOverride: 'Neeraj Joshi stock market basics options trading' },
  { name: 'Yadnya Kathale', initials: 'YK', gradient: 'from-amber-600 to-amber-900', handle: '@yadnyakathale', fallbackSubscribers: '900K', searchQueryOverride: 'Yadnya Kathale stock analysis mutual funds' },
  { name: 'Arun Singh Tanwar', initials: 'AT', gradient: 'from-blue-600 to-cyan-900', handle: '@arunsinghtanwar', fallbackSubscribers: '500K', searchQueryOverride: 'Arun Singh Tanwar stock market trading' },
  { name: 'Sooraj Singh Gurjar', initials: 'SG', gradient: 'from-indigo-600 to-indigo-900', handle: '@soorajsinghgurjar', fallbackSubscribers: '400K', searchQueryOverride: 'Sooraj Singh Gurjar stock market indices trading' },
  { name: 'P R Sundar', initials: 'PS', gradient: 'from-purple-800 to-slate-900', handle: '@prsundar', fallbackSubscribers: '1.1M', searchQueryOverride: 'P R Sundar stock market options trading' },
  { name: 'IITian Trader', initials: 'IT', gradient: 'from-emerald-700 to-zinc-900', handle: '@iitiantrader', fallbackSubscribers: '600K', searchQueryOverride: 'IITian Trader stock options chart pattern trading' },
  { name: 'Trading Chanakya', initials: 'TC', gradient: 'from-orange-700 to-stone-900', handle: '@tradingchanakya', fallbackSubscribers: '800K', searchQueryOverride: 'Trading Chanakya stock technical analysis algorithmic trading' },
  { name: 'Elearnmarkets', initials: 'EM', gradient: 'from-cyan-600 to-teal-900', handle: '@elearnmarkets', fallbackSubscribers: '1.2M', searchQueryOverride: 'Elearnmarkets stock market courses finance trading webinars' },
  { name: 'Rakesh Jhunjhunwala', initials: 'RJ', gradient: 'from-rose-800 to-rose-950', handle: '@rakeshjhunjhunwala', fallbackSubscribers: '2M', searchQueryOverride: 'Rakesh Jhunjhunwala stock market portfolio advice' },
  { name: 'Radhakishan Damani', initials: 'RD', gradient: 'from-amber-800 to-amber-950', handle: '@radhakishandamani', fallbackSubscribers: '500K', searchQueryOverride: 'Radhakishan Damani DMart investor' },
  { name: 'Vijay Kedia', initials: 'VK', gradient: 'from-blue-800 to-blue-950', handle: '@vijaykedia', fallbackSubscribers: '400K', searchQueryOverride: 'Vijay Kedia stock market investment strategy' },
  { name: 'Porinju Veliyath', initials: 'PV', gradient: 'from-teal-800 to-teal-950', handle: '@porinjuveliyath', fallbackSubscribers: '300K', searchQueryOverride: 'Porinju Veliyath equity intelligence small cap stocks' },
  { name: 'Ranveer Allahbadia', initials: 'RA', gradient: 'from-red-700 to-rose-600', handle: '@beerbiceps', fallbackSubscribers: '11.1M' },
  { name: 'Raj Shamani', initials: 'RS', gradient: 'from-blue-700 to-cyan-600', handle: '@rajshamani', fallbackSubscribers: '4.5M' },
  { name: 'Nikhil Kamath', initials: 'NK', gradient: 'from-emerald-700 to-teal-600', handle: '@nikhil.kamath', fallbackSubscribers: '1.4M' },
  { name: 'Prakhar Gupta', initials: 'PG', gradient: 'from-purple-700 to-indigo-600', handle: '@prakharkepravachan', fallbackSubscribers: '350K' },
  { name: 'Cyrus Broacha', initials: 'CB', gradient: 'from-slate-600 to-zinc-800', handle: '@cyrussays', fallbackSubscribers: '250K' },
  { name: 'Vinamre Kasanaa', initials: 'VK', gradient: 'from-orange-600 to-yellow-500', handle: '@dostcast', fallbackSubscribers: '1.8M' },
  { name: 'Sandeep Maheshwari', initials: 'SM', gradient: 'from-cyan-600 to-blue-500', handle: '@SandeepSeminars', fallbackSubscribers: '28.5M' },
  { name: 'Ankur Warikoo', initials: 'AW', gradient: 'from-teal-600 to-emerald-500', handle: '@ankurwarikoo', fallbackSubscribers: '3.9M' },
  { name: 'Gaurav Taneja', initials: 'GT', gradient: 'from-amber-600 to-orange-500', handle: '@flyingbeast320', fallbackSubscribers: '9.2M' },
  { name: 'Varun Mayya', initials: 'VM', gradient: 'from-violet-600 to-fuchsia-500', handle: '@varunmayya', fallbackSubscribers: '480K' },
  { name: 'Deepak Kanakaraju', initials: 'DK', gradient: 'from-lime-600 to-green-500', handle: '@digitaldeepak', fallbackSubscribers: '150K' },
  { name: 'Aman Gupta', initials: 'AG', gradient: 'from-pink-600 to-rose-500', handle: '@amanguptaboat', fallbackSubscribers: '200K' }
];

// ==========================================
// 🎵 MUSIC CHANNELS DATA — Curated YouTube Music Sources
// ==========================================
interface MusicChannel {
  name: string;
  initials: string;
  gradient: string;
  handle: string;
  fallbackSubscribers: string;
  searchQueryOverride: string;
}

const MUSIC_CHANNELS_INDIAN_LABELS: MusicChannel[] = [
  { name: 'T-Series', initials: 'TS', gradient: 'from-red-600 to-red-900', handle: '@tsaborateam', fallbackSubscribers: '268M', searchQueryOverride: 'T-Series latest Bollywood songs official' },
  { name: 'Zee Music Company', initials: 'ZM', gradient: 'from-blue-600 to-blue-900', handle: '@zeemusiccompany', fallbackSubscribers: '108M', searchQueryOverride: 'Zee Music Company latest songs official' },
  { name: 'Saregama', initials: 'SG', gradient: 'from-amber-600 to-amber-900', handle: '@saaborateam', fallbackSubscribers: '74M', searchQueryOverride: 'Saregama Music new songs official' },
  { name: 'Tips Official', initials: 'TO', gradient: 'from-green-600 to-green-900', handle: '@taborateam', fallbackSubscribers: '36M', searchQueryOverride: 'Tips Official new Bollywood songs' },
  { name: 'Yash Raj Films', initials: 'YR', gradient: 'from-yellow-600 to-yellow-900', handle: '@yaborateam', fallbackSubscribers: '56M', searchQueryOverride: 'Yash Raj Films songs official music video' },
  { name: 'Sony Music India', initials: 'SM', gradient: 'from-slate-600 to-slate-900', handle: '@saborateamIndia', fallbackSubscribers: '42M', searchQueryOverride: 'Sony Music India latest songs official' },
  { name: 'Universal Music India', initials: 'UM', gradient: 'from-purple-600 to-purple-900', handle: '@uaborateamIndia', fallbackSubscribers: '15M', searchQueryOverride: 'Universal Music India new songs official' },
];

const MUSIC_CHANNELS_PUNJABI: MusicChannel[] = [
  { name: 'Speed Records', initials: 'SR', gradient: 'from-orange-600 to-red-800', handle: '@speedrecords', fallbackSubscribers: '35M', searchQueryOverride: 'Speed Records latest Punjabi songs official' },
  { name: 'White Hill Music', initials: 'WH', gradient: 'from-cyan-600 to-cyan-900', handle: '@whitehillmusic', fallbackSubscribers: '28M', searchQueryOverride: 'White Hill Music Punjabi songs latest' },
  { name: 'Jass Records', initials: 'JR', gradient: 'from-rose-600 to-rose-900', handle: '@jassrecords', fallbackSubscribers: '12M', searchQueryOverride: 'Jass Records Punjabi new songs official' },
  { name: 'Single Track Studio', initials: 'ST', gradient: 'from-violet-600 to-violet-900', handle: '@singletrackstudio', fallbackSubscribers: '8M', searchQueryOverride: 'Single Track Studio Punjabi latest official' },
  { name: 'Brown Town Music', initials: 'BT', gradient: 'from-amber-700 to-stone-900', handle: '@browntownmusic', fallbackSubscribers: '4M', searchQueryOverride: 'Brown Town Music Punjabi official video' },
];

const MUSIC_CHANNELS_SOUTH: MusicChannel[] = [
  { name: 'Think Music India', initials: 'TM', gradient: 'from-teal-600 to-teal-900', handle: '@thinkmusic', fallbackSubscribers: '18M', searchQueryOverride: 'Think Music India Tamil songs latest' },
  { name: 'Sony Music South', initials: 'SS', gradient: 'from-indigo-600 to-indigo-900', handle: '@sonymusicindiasouth', fallbackSubscribers: '32M', searchQueryOverride: 'Sony Music South Tamil Telugu latest songs' },
  { name: 'Lahari Music', initials: 'LM', gradient: 'from-emerald-600 to-emerald-900', handle: '@laharimusic', fallbackSubscribers: '25M', searchQueryOverride: 'Lahari Music Telugu Tamil songs latest official' },
  { name: 'Aditya Music', initials: 'AM', gradient: 'from-sky-600 to-sky-900', handle: '@adityamusic', fallbackSubscribers: '30M', searchQueryOverride: 'Aditya Music Telugu latest songs official' },
  { name: 'Mango Music', initials: 'MM', gradient: 'from-orange-500 to-orange-800', handle: '@mangomusic', fallbackSubscribers: '16M', searchQueryOverride: 'Mango Music Telugu songs latest official' },
  { name: 'Muzik247', initials: 'MZ', gradient: 'from-lime-600 to-lime-900', handle: '@muzik247', fallbackSubscribers: '8M', searchQueryOverride: 'Muzik247 Malayalam songs latest official' },
  { name: 'Millennium Audios', initials: 'MA', gradient: 'from-pink-600 to-pink-900', handle: '@millenniumaudios', fallbackSubscribers: '3M', searchQueryOverride: 'Millennium Audios Malayalam songs official' },
  { name: 'SVF Music', initials: 'SV', gradient: 'from-fuchsia-600 to-fuchsia-900', handle: '@svfmusic', fallbackSubscribers: '10M', searchQueryOverride: 'SVF Music Bengali songs latest official' },
  { name: 'Wave Music', initials: 'WM', gradient: 'from-red-500 to-red-800', handle: '@wavemusic', fallbackSubscribers: '22M', searchQueryOverride: 'Wave Music Bhojpuri songs latest official' },
  { name: 'Worldwide Records Bhojpuri', initials: 'WR', gradient: 'from-amber-500 to-amber-800', handle: '@worldwiderecordsbhojpuri', fallbackSubscribers: '15M', searchQueryOverride: 'Worldwide Records Bhojpuri songs latest' },
];

const MUSIC_CHANNELS_INTERNATIONAL: MusicChannel[] = [
  { name: 'Vevo', initials: 'VV', gradient: 'from-red-500 to-black', handle: '@vevo', fallbackSubscribers: '28M', searchQueryOverride: 'Vevo official music video latest' },
  { name: 'Universal Music', initials: 'UM', gradient: 'from-blue-600 to-slate-900', handle: '@universalmusicgroup', fallbackSubscribers: '35M', searchQueryOverride: 'Universal Music Group official latest' },
  { name: 'Sony Music', initials: 'SM', gradient: 'from-black to-zinc-800', handle: '@sonymusic', fallbackSubscribers: '32M', searchQueryOverride: 'Sony Music Entertainment official latest' },
  { name: 'Warner Music', initials: 'WM', gradient: 'from-blue-800 to-blue-950', handle: '@warnermusic', fallbackSubscribers: '18M', searchQueryOverride: 'Warner Music Group official latest' },
  { name: 'Atlantic Records', initials: 'AR', gradient: 'from-red-700 to-red-950', handle: '@atlanticrecords', fallbackSubscribers: '20M', searchQueryOverride: 'Atlantic Records official music video' },
  { name: 'Republic Records', initials: 'RR', gradient: 'from-zinc-600 to-zinc-900', handle: '@republicrecords', fallbackSubscribers: '12M', searchQueryOverride: 'Republic Records official music video latest' },
  { name: 'Interscope Records', initials: 'IR', gradient: 'from-stone-600 to-stone-900', handle: '@interscoperecords', fallbackSubscribers: '10M', searchQueryOverride: 'Interscope Records official music latest' },
  { name: 'Def Jam Recordings', initials: 'DJ', gradient: 'from-yellow-600 to-yellow-900', handle: '@defjam', fallbackSubscribers: '8M', searchQueryOverride: 'Def Jam Recordings official music video' },
  { name: 'Capitol Records', initials: 'CR', gradient: 'from-amber-600 to-amber-900', handle: '@capitolrecords', fallbackSubscribers: '6M', searchQueryOverride: 'Capitol Records official music video' },
  { name: 'Island Records', initials: 'IL', gradient: 'from-emerald-600 to-emerald-900', handle: '@islandrecords', fallbackSubscribers: '7M', searchQueryOverride: 'Island Records official music video latest' },
  { name: 'Columbia Records', initials: 'CL', gradient: 'from-rose-600 to-rose-900', handle: '@columbiarecords', fallbackSubscribers: '9M', searchQueryOverride: 'Columbia Records official music latest' },
  { name: 'RCA Records', initials: 'RC', gradient: 'from-violet-600 to-violet-900', handle: '@rcarecords', fallbackSubscribers: '5M', searchQueryOverride: 'RCA Records official music video latest' },
];

const MUSIC_CHANNELS_ENGLISH_ARTISTS: MusicChannel[] = [
  { name: 'Taylor Swift', initials: 'TS', gradient: 'from-purple-500 to-pink-700', handle: '@taylorswift', fallbackSubscribers: '58M', searchQueryOverride: 'Taylor Swift official music video latest' },
  { name: 'Ed Sheeran', initials: 'ES', gradient: 'from-orange-500 to-red-700', handle: '@edsheeran', fallbackSubscribers: '55M', searchQueryOverride: 'Ed Sheeran official music video latest' },
  { name: 'The Weeknd', initials: 'TW', gradient: 'from-red-600 to-red-950', handle: '@theweeknd', fallbackSubscribers: '38M', searchQueryOverride: 'The Weeknd official music video latest' },
  { name: 'Drake', initials: 'DR', gradient: 'from-amber-600 to-stone-900', handle: '@drakeofficial', fallbackSubscribers: '30M', searchQueryOverride: 'Drake official music video latest songs' },
  { name: 'Justin Bieber', initials: 'JB', gradient: 'from-blue-500 to-purple-700', handle: '@justinbieber', fallbackSubscribers: '72M', searchQueryOverride: 'Justin Bieber official music video latest' },
  { name: 'Billie Eilish', initials: 'BE', gradient: 'from-green-600 to-black', handle: '@billieeilish', fallbackSubscribers: '48M', searchQueryOverride: 'Billie Eilish official music video latest' },
  { name: 'Dua Lipa', initials: 'DL', gradient: 'from-pink-500 to-fuchsia-700', handle: '@dualipa', fallbackSubscribers: '28M', searchQueryOverride: 'Dua Lipa official music video latest' },
  { name: 'Ariana Grande', initials: 'AG', gradient: 'from-violet-500 to-purple-800', handle: '@arianagrande', fallbackSubscribers: '55M', searchQueryOverride: 'Ariana Grande official music video latest' },
  { name: 'Bruno Mars', initials: 'BM', gradient: 'from-amber-500 to-amber-800', handle: '@brunomars', fallbackSubscribers: '42M', searchQueryOverride: 'Bruno Mars official music video latest' },
  { name: 'Coldplay', initials: 'CP', gradient: 'from-cyan-500 to-blue-800', handle: '@coldplay', fallbackSubscribers: '24M', searchQueryOverride: 'Coldplay official music video latest' },
  { name: 'Imagine Dragons', initials: 'ID', gradient: 'from-yellow-500 to-red-700', handle: '@imaginedragons', fallbackSubscribers: '22M', searchQueryOverride: 'Imagine Dragons official music video latest' },
  { name: 'Maroon 5', initials: 'M5', gradient: 'from-red-500 to-red-800', handle: '@maroon5', fallbackSubscribers: '37M', searchQueryOverride: 'Maroon 5 official music video latest' },
  { name: 'Eminem', initials: 'EM', gradient: 'from-gray-600 to-black', handle: '@eminem', fallbackSubscribers: '56M', searchQueryOverride: 'Eminem official music video latest' },
  { name: 'Post Malone', initials: 'PM', gradient: 'from-zinc-500 to-zinc-800', handle: '@postmalone', fallbackSubscribers: '28M', searchQueryOverride: 'Post Malone official music video latest' },
  { name: 'Olivia Rodrigo', initials: 'OR', gradient: 'from-purple-500 to-violet-800', handle: '@oliviarodrigo', fallbackSubscribers: '16M', searchQueryOverride: 'Olivia Rodrigo official music video latest' },
];

const MUSIC_CHANNELS_KPOP: MusicChannel[] = [
  { name: 'BTS', initials: 'BT', gradient: 'from-purple-500 to-violet-900', handle: '@bts', fallbackSubscribers: '76M', searchQueryOverride: 'BTS official music video latest MV' },
  { name: 'BLACKPINK', initials: 'BP', gradient: 'from-pink-500 to-black', handle: '@blackpink', fallbackSubscribers: '94M', searchQueryOverride: 'BLACKPINK official music video latest MV' },
  { name: 'TWICE', initials: 'TW', gradient: 'from-rose-400 to-rose-700', handle: '@twice', fallbackSubscribers: '18M', searchQueryOverride: 'TWICE official music video latest MV' },
  { name: 'Stray Kids', initials: 'SK', gradient: 'from-red-600 to-black', handle: '@straykids', fallbackSubscribers: '19M', searchQueryOverride: 'Stray Kids official music video latest MV' },
  { name: 'SEVENTEEN', initials: 'SV', gradient: 'from-sky-400 to-sky-800', handle: '@seventeen', fallbackSubscribers: '16M', searchQueryOverride: 'SEVENTEEN official music video latest MV' },
  { name: 'NewJeans', initials: 'NJ', gradient: 'from-blue-300 to-indigo-600', handle: '@newjeans', fallbackSubscribers: '14M', searchQueryOverride: 'NewJeans official music video latest MV' },
  { name: 'EXO', initials: 'EX', gradient: 'from-zinc-400 to-zinc-800', handle: '@exo', fallbackSubscribers: '12M', searchQueryOverride: 'EXO official music video latest MV' },
];

const MUSIC_CHANNELS_LATIN: MusicChannel[] = [
  { name: 'Bad Bunny', initials: 'BB', gradient: 'from-lime-500 to-emerald-800', handle: '@badbunny', fallbackSubscribers: '48M', searchQueryOverride: 'Bad Bunny official music video latest' },
  { name: 'J Balvin', initials: 'JB', gradient: 'from-yellow-500 to-orange-700', handle: '@jbalvin', fallbackSubscribers: '35M', searchQueryOverride: 'J Balvin official music video latest reggaeton' },
  { name: 'Karol G', initials: 'KG', gradient: 'from-blue-400 to-blue-700', handle: '@karolg', fallbackSubscribers: '38M', searchQueryOverride: 'Karol G official music video latest' },
  { name: 'Shakira', initials: 'SH', gradient: 'from-amber-400 to-red-600', handle: '@shakira', fallbackSubscribers: '34M', searchQueryOverride: 'Shakira official music video latest' },
  { name: 'Rauw Alejandro', initials: 'RA', gradient: 'from-purple-500 to-pink-700', handle: '@rauwalejandro', fallbackSubscribers: '16M', searchQueryOverride: 'Rauw Alejandro official music video latest' },
];

const MUSIC_CHANNELS_INDIAN_ARTISTS: MusicChannel[] = [
  { name: 'Arijit Singh', initials: 'AS', gradient: 'from-rose-600 to-rose-900', handle: '@arijitsingh', fallbackSubscribers: '12M', searchQueryOverride: 'Arijit Singh official songs latest live' },
  { name: 'Shreya Ghoshal', initials: 'SG', gradient: 'from-pink-500 to-pink-800', handle: '@shreyaghoshal', fallbackSubscribers: '8M', searchQueryOverride: 'Shreya Ghoshal official songs latest' },
  { name: 'A. R. Rahman', initials: 'AR', gradient: 'from-blue-600 to-indigo-900', handle: '@araborateam', fallbackSubscribers: '6M', searchQueryOverride: 'A R Rahman official songs latest music' },
  { name: 'Sonu Nigam', initials: 'SN', gradient: 'from-emerald-600 to-emerald-900', handle: '@sonunigam', fallbackSubscribers: '5M', searchQueryOverride: 'Sonu Nigam official songs latest live' },
  { name: 'Diljit Dosanjh', initials: 'DD', gradient: 'from-yellow-500 to-amber-800', handle: '@diljitdosanjh', fallbackSubscribers: '15M', searchQueryOverride: 'Diljit Dosanjh official Punjabi songs latest' },
  { name: 'AP Dhillon', initials: 'AP', gradient: 'from-slate-600 to-black', handle: '@apdhillon', fallbackSubscribers: '8M', searchQueryOverride: 'AP Dhillon official songs latest Punjabi' },
  { name: 'Badshah', initials: 'BS', gradient: 'from-red-600 to-red-950', handle: '@badshah', fallbackSubscribers: '20M', searchQueryOverride: 'Badshah official songs latest rap Hindi' },
  { name: 'Yo Yo Honey Singh', initials: 'YH', gradient: 'from-zinc-600 to-zinc-900', handle: '@yoyohoneysingh', fallbackSubscribers: '22M', searchQueryOverride: 'Yo Yo Honey Singh official songs latest' },
  { name: 'Neha Kakkar', initials: 'NK', gradient: 'from-fuchsia-500 to-fuchsia-800', handle: '@nehakakkar', fallbackSubscribers: '15M', searchQueryOverride: 'Neha Kakkar official songs latest Bollywood' },
  { name: 'Jubin Nautiyal', initials: 'JN', gradient: 'from-teal-600 to-teal-900', handle: '@jubinnautiyal', fallbackSubscribers: '10M', searchQueryOverride: 'Jubin Nautiyal official songs latest' },
  { name: 'KK', initials: 'KK', gradient: 'from-stone-600 to-stone-900', handle: '@kk', fallbackSubscribers: '4M', searchQueryOverride: 'KK singer official songs best of KK' },
  { name: 'Pritam', initials: 'PR', gradient: 'from-indigo-600 to-indigo-900', handle: '@pritam', fallbackSubscribers: '3M', searchQueryOverride: 'Pritam official Bollywood songs latest composer' },
  { name: 'Anirudh Ravichander', initials: 'AN', gradient: 'from-orange-500 to-orange-800', handle: '@anirudhofficial', fallbackSubscribers: '10M', searchQueryOverride: 'Anirudh Ravichander official songs latest Tamil' },
  { name: 'Sid Sriram', initials: 'SS', gradient: 'from-cyan-600 to-cyan-900', handle: '@sidsriram', fallbackSubscribers: '5M', searchQueryOverride: 'Sid Sriram official songs latest Tamil Telugu' },
  { name: 'Karan Aujla', initials: 'KA', gradient: 'from-red-500 to-black', handle: '@karanaujla', fallbackSubscribers: '12M', searchQueryOverride: 'Karan Aujla official Punjabi songs latest' },
];

type MusicChannelGroup = 'bollywood' | 'punjabi' | 'south' | 'international' | 'english_artists' | 'kpop' | 'latin' | 'indian_artists';

const MUSIC_GROUP_MAP: Record<MusicChannelGroup, { label: string; channels: MusicChannel[] }> = {
  bollywood: { label: '🇮🇳 Bollywood & Mainstream', channels: MUSIC_CHANNELS_INDIAN_LABELS },
  punjabi: { label: '🇮🇳 Punjabi', channels: MUSIC_CHANNELS_PUNJABI },
  south: { label: '🇮🇳 South & Regional', channels: MUSIC_CHANNELS_SOUTH },
  international: { label: '🌍 International Labels', channels: MUSIC_CHANNELS_INTERNATIONAL },
  english_artists: { label: '🇺🇸 English Artists', channels: MUSIC_CHANNELS_ENGLISH_ARTISTS },
  kpop: { label: '🇰🇷 K-Pop', channels: MUSIC_CHANNELS_KPOP },
  latin: { label: '🌎 Latin', channels: MUSIC_CHANNELS_LATIN },
  indian_artists: { label: '🇮🇳 Indian Artists', channels: MUSIC_CHANNELS_INDIAN_ARTISTS },
};

const MUSIC_GENRE_CATEGORIES = [
  { id: 'all', label: 'All Music', Icon: Layers },
  { id: 'pop', label: 'Pop', Icon: Music2 },
  { id: 'hiphop', label: 'Hip-Hop & Rap', Icon: Mic2 },
  { id: 'rock', label: 'Rock', Icon: Guitar },
  { id: 'electronic', label: 'Electronic & DJ', Icon: Disc3 },
  { id: 'classical', label: 'Classical', Icon: Sparkles },
  { id: 'lofi', label: 'Lofi & Chill', Icon: Headphones },
  { id: 'devotional', label: 'Devotional', Icon: Compass },
  { id: 'indie', label: 'Indie & Folk', Icon: Guitar },
  { id: 'jazz', label: 'Jazz & Blues', Icon: Music2 },
  { id: 'country', label: 'Country', Icon: Music2 },
  { id: 'metal', label: 'Metal', Icon: Flame },
  { id: 'soundtrack', label: 'Soundtracks', Icon: Film },
  { id: 'karaoke', label: 'Karaoke', Icon: Mic2 },
  { id: 'instrumental', label: 'Instrumentals', Icon: Headphones },
];

export const LiveStageView: React.FC = () => {
  const {
    allTracks,
    playTrack,
    currentTrack,
    isPlaying,
    toggleFavorite,
    isFavorite
  } = useAudioPlayer();

  // stageMode controls whether we are in the Podcast Hub (primary) or Digital Concert Stage (secondary)
  const [stageMode, setStageMode] = useState<'podcast' | 'concert' | 'music'>(() => {
    return localStorage.getItem('playme_pending_podcast_host') ? 'podcast' : 'music';
  });

  // Music Hub states
  const [musicChannelGroup, setMusicChannelGroup] = useState<MusicChannelGroup>('bollywood');
  const [selectedMusicChannel, setSelectedMusicChannel] = useState<string | null>(null);
  const [musicSearchResults, setMusicSearchResults] = useState<Track[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [isMusicSearching, setIsMusicSearching] = useState(false);
  const [musicSearchFeedResults, setMusicSearchFeedResults] = useState<Track[]>([]);
  const [selectedMusicGenre, setSelectedMusicGenre] = useState<string>('all');
  const [cachedMusicChannelDetails, setCachedMusicChannelDetails] = useState<Record<string, { dpUrl: string; subscribers: string; channelId?: string }>>({});
  
  // Podcast Host directory states
  const [hostGroup, setHostGroup] = useState<'top' | 'global' | 'indian'>('top');
  const [selectedHost, setSelectedHost] = useState<string | null>(() => {
    return localStorage.getItem('playme_pending_podcast_host') || null;
  });
  
  useEffect(() => {
    // Clear pending host once consumed
    if (localStorage.getItem('playme_pending_podcast_host')) {
      localStorage.removeItem('playme_pending_podcast_host');
    }

    const handleNavToHost = (e: any) => {
      if (e.detail?.hostName) {
        setSelectedHost(e.detail.hostName);
        setStageMode('podcast');
      }
    };
    window.addEventListener('navigate-to-podcast-host', handleNavToHost);
    return () => window.removeEventListener('navigate-to-podcast-host', handleNavToHost);
  }, []);
  const [podcastSearchResults, setPodcastSearchResults] = useState<Track[]>([]);
  const [isSearchingPodcasts, setIsSearchingPodcasts] = useState(false);

  // Podcast search bar state
  const [podcastSearchQuery, setPodcastSearchQuery] = useState('');
  const [isPodcastSearching, setIsPodcastSearching] = useState(false);
  const [podcastSearchFeedResults, setPodcastSearchFeedResults] = useState<Track[]>([]);

  // Live DP & Subscriber cached state
  const [cachedHostDetails, setCachedHostDetails] = useState<Record<string, { dpUrl: string; subscribers: string; channelId?: string }>>({});

  // Podcast categories filter
  const [selectedPodcastCategory, setSelectedPodcastCategory] = useState<string>('all');

  // Custom added podcasts state
  const [customPodcasts, setCustomPodcasts] = useState<Track[]>([]);
  
  // Concert live feed states
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'concert' | 'festival' | 'acoustic'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load cached host details & custom podcasts on mount
  useEffect(() => {
    const savedDetails = localStorage.getItem('playme_host_details_cache');
    if (savedDetails) {
      try {
        const parsed = JSON.parse(savedDetails);
        if (parsed && typeof parsed === 'object') {
          setCachedHostDetails(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse host details cache:', e);
      }
    }

    const savedCustomPodcasts = localStorage.getItem('playme_custom_podcasts');
    if (savedCustomPodcasts) {
      try {
        const parsed = JSON.parse(savedCustomPodcasts);
        if (Array.isArray(parsed)) {
          setCustomPodcasts(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse custom podcasts:', e);
      }
    }
  }, []);

  // Pick active host directory group
  const activeHosts = 
    (hostGroup === 'global' ? GLOBAL_HOSTS :
     hostGroup === 'indian' ? INDIAN_HOSTS : TOP_HOSTS) || [];

  // Fetch live YouTube details (avatar + subscriber counts) and cache them
  const fetchLiveChannelDetails = async (hostName: string) => {
    try {
      const apiKey = getYoutubeApiKey();
      if (!apiKey) return;

      // 1. Search for the YouTube Channel ID and basic snippet details
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(hostName)}&maxResults=1&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) return;
      const searchData = await searchRes.json();
      const channelItem = searchData.items?.[0];
      if (!channelItem) return;

      const channelId = channelItem.id.channelId;
      const dpUrl = channelItem.snippet.thumbnails?.medium?.url || channelItem.snippet.thumbnails?.default?.url || '';

      // 2. Fetch specific statistics for the Channel ID to retrieve actual subscriber count
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
      const channelRes = await fetch(channelUrl);
      if (!channelRes.ok) return;
      const channelData = await channelRes.json();
      const stats = channelData.items?.[0]?.statistics;
      
      let subscriberCount = 'N/A';
      if (stats?.subscriberCount) {
        const count = parseInt(stats.subscriberCount, 10);
        if (count >= 1000000) {
          subscriberCount = `${(count / 1000000).toFixed(1)}M subscribers`;
        } else if (count >= 1000) {
          subscriberCount = `${(count / 1000).toFixed(0)}K subscribers`;
        } else {
          subscriberCount = `${count} subscribers`;
        }
      }

      setCachedHostDetails(prev => {
        const updated = {
          ...prev,
          [hostName]: { dpUrl, subscribers: subscriberCount, channelId }
        };
        localStorage.setItem('playme_host_details_cache', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.warn(`Failed to retrieve live stats for host ${hostName}:`, err);
    }
  };

  // Background resolver sequence for the active directory host group (sequential calls)
  useEffect(() => {
    const apiKey = getYoutubeApiKey();
    if (!apiKey) return;

    activeHosts.forEach((host, idx) => {
      if (!cachedHostDetails[host.name]) {
        const timer = setTimeout(() => {
          fetchLiveChannelDetails(host.name);
        }, idx * 800); // space requests by 800ms
        return () => clearTimeout(timer);
      }
    });
  }, [hostGroup, activeHosts]);

  // Load Concert stage results when filter changes
  useEffect(() => {
    if (stageMode === 'concert') {
      loadFeaturedLive();
    }
  }, [activeFilter, stageMode]);

  // Load cached music channel details on mount
  useEffect(() => {
    const savedDetails = localStorage.getItem('playme_music_channel_details_cache');
    if (savedDetails) {
      try {
        const parsed = JSON.parse(savedDetails);
        if (parsed && typeof parsed === 'object') {
          setCachedMusicChannelDetails(parsed);
        }
      } catch (e) {
        console.warn('Failed to parse music channel details cache:', e);
      }
    }
  }, []);

  // Fetch live YouTube details for music channels and cache
  const fetchMusicChannelDetails = async (channelName: string) => {
    try {
      const apiKey = getYoutubeApiKey();
      if (!apiKey) return;
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelName)}&maxResults=1&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) return;
      const searchData = await searchRes.json();
      const channelItem = searchData.items?.[0];
      if (!channelItem) return;
      const channelId = channelItem.id.channelId;
      const dpUrl = channelItem.snippet.thumbnails?.medium?.url || channelItem.snippet.thumbnails?.default?.url || '';
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
      const channelRes = await fetch(channelUrl);
      if (!channelRes.ok) return;
      const channelData = await channelRes.json();
      const stats = channelData.items?.[0]?.statistics;
      let subscriberCount = 'N/A';
      if (stats?.subscriberCount) {
        const count = parseInt(stats.subscriberCount, 10);
        if (count >= 1000000) subscriberCount = `${(count / 1000000).toFixed(1)}M subscribers`;
        else if (count >= 1000) subscriberCount = `${(count / 1000).toFixed(0)}K subscribers`;
        else subscriberCount = `${count} subscribers`;
      }
      setCachedMusicChannelDetails(prev => {
        const updated = { ...prev, [channelName]: { dpUrl, subscribers: subscriberCount, channelId } };
        localStorage.setItem('playme_music_channel_details_cache', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.warn(`Failed to retrieve live stats for music channel ${channelName}:`, err);
    }
  };

  // Background resolver for music channels
  const activeMusicChannels = MUSIC_GROUP_MAP[musicChannelGroup]?.channels || [];
  useEffect(() => {
    if (stageMode !== 'music') return;
    const apiKey = getYoutubeApiKey();
    if (!apiKey) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    activeMusicChannels.forEach((ch, idx) => {
      if (!cachedMusicChannelDetails[ch.name]) {
        const timer = setTimeout(() => fetchMusicChannelDetails(ch.name), idx * 800);
        timers.push(timer);
      }
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [musicChannelGroup, stageMode]);

  // Load music tracks when a channel is selected
  useEffect(() => {
    if (!selectedMusicChannel || stageMode !== 'music') {
      setMusicSearchResults([]);
      return;
    }
    const fetchChannelMusic = async () => {
      setIsSearchingMusic(true);
      setErrorMsg(null);
      try {
        const allChannels = Object.values(MUSIC_GROUP_MAP).flatMap(g => g.channels);
        const channelObj = allChannels.find(c => c.name === selectedMusicChannel);
        let results;
        const channelId = cachedMusicChannelDetails[selectedMusicChannel]?.channelId;
        if (channelId) {
          results = await searchYoutubeMusic('', undefined, channelId);
        } else {
          const query = channelObj?.searchQueryOverride || `${selectedMusicChannel} official music`;
          results = await searchYoutubeMusic(query);
        }
        setMusicSearchResults(results);
      } catch (err: any) {
        console.error('Error fetching music channel tracks:', err);
        setErrorMsg(err.message || `Could not retrieve tracks for ${selectedMusicChannel}.`);
      } finally {
        setIsSearchingMusic(false);
      }
    };
    fetchChannelMusic();
  }, [selectedMusicChannel]);

  // Music search handler
  const handleMusicSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicSearchQuery.trim()) return;
    setIsMusicSearching(true);
    setErrorMsg(null);
    try {
      const query = `${musicSearchQuery.trim()} official music`;
      const results = await searchYoutubeMusic(query);
      setMusicSearchFeedResults(results);
      if (results.length === 0) {
        setErrorMsg('No music tracks found matching that search. Try different keywords.');
      }
    } catch (err: any) {
      console.error('Music search error:', err);
      setErrorMsg(err.message || 'Search failed. Check your connection or API key.');
    } finally {
      setIsMusicSearching(false);
    }
  };

  // Load dynamic host podcast episodes when host changes
  useEffect(() => {
    if (!selectedHost) {
      setPodcastSearchResults([]);
      return;
    }

    // Clear any active podcast search feed so filtered results show correctly
    setPodcastSearchFeedResults([]);
    setPodcastSearchQuery('');

    const fetchHostPodcasts = async () => {
      setIsSearchingPodcasts(true);
      setErrorMsg(null);
      try {
        const allHosts = [...TOP_HOSTS, ...GLOBAL_HOSTS, ...INDIAN_HOSTS];
        const hostObj = allHosts.find(h => h.name === selectedHost);
        
        const channelId = cachedHostDetails[selectedHost]?.channelId;
        const hostNameLower = selectedHost.toLowerCase();
        
        // Build a helper to check if a track's artist/channel matches the selected host
        const isFromHost = (track: Track): boolean => {
          const artist = (track.artist || '').toLowerCase();
          const title = (track.title || '').toLowerCase();
          // Match if the channel name contains the host name or vice versa
          // Also check if the host's first or last name appears in channel title
          const nameParts = hostNameLower.split(' ').filter(p => p.length > 2);
          return (
            artist.includes(hostNameLower) ||
            hostNameLower.includes(artist) ||
            nameParts.some(part => artist.includes(part)) ||
            // For channels with different names (e.g., "BeerBiceps" for Ranveer Allahbadia)
            // check the handle too
            (hostObj?.handle && artist.includes(hostObj.handle.replace('@', '').toLowerCase())) ||
            // Also match if the host name appears in the video title (for featured episodes)
            nameParts.every(part => title.includes(part))
          );
        };

        let results: Track[] = [];

        if (channelId) {
          // Fetch strictly from the broadcaster's YouTube channel using channelId
          // Use host name as query for better relevance within the channel
          const channelQuery = hostObj?.searchQueryOverride || selectedHost;
          results = await searchYoutubeMusic(channelQuery, 'long', channelId);
          
          // If channelId search returned few results, also try without query restriction
          if (results.filter(t => t.duration >= 600).length < 3) {
            const broadResults = await searchYoutubeMusic('', 'long', channelId);
            // Merge, deduplicating by id
            const existingIds = new Set(results.map(r => r.id));
            results = [...results, ...broadResults.filter(r => !existingIds.has(r.id))];
          }
        } else {
          // Fallback to keyword search if channel ID is not available
          const query = hostObj?.searchQueryOverride || `${selectedHost} podcast full episode`;
          results = await searchYoutubeMusic(query, 'long');
        }
        
        // Strictly filter: only keep videos from the host's channel or clearly about the host
        let filtered = results
          .filter(track => track.duration >= 600)
          .filter(track => channelId ? true : isFromHost(track));
        
        // If channel-scoped search returned results, also apply host filter to remove unrelated collabs
        if (channelId && filtered.length > 0) {
          // When we have channelId, trust all results from that channel
          filtered = results.filter(track => track.duration >= 600);
        }

        // Normalize results: tag them as podcasts and set host as artist
        const normalized = filtered.map(track => ({
          ...track,
          isPodcast: true,
          category: 'Podcast Episode',
          artist: selectedHost
        }));
        
        setPodcastSearchResults(normalized);

        if (normalized.length === 0) {
          setErrorMsg(`No podcast episodes found exclusively from ${selectedHost}. Try selecting them from the host directory.`);
        }
      } catch (err: any) {
        console.error('Error fetching host podcasts:', err);
        setErrorMsg(err.message || `Could not retrieve episodes for ${selectedHost}.`);
      } finally {
        setIsSearchingPodcasts(false);
      }
    };

    fetchHostPodcasts();
  }, [selectedHost]);

  const loadFeaturedLive = async () => {
    setIsSearching(true);
    setErrorMsg(null);
    try {
      let query = 'live concert set performance';
      if (activeFilter === 'live') query = 'chill lofi radio live stream';
      else if (activeFilter === 'festival') query = 'Coachella Tomorrowland festival set 2026';
      else if (activeFilter === 'acoustic') query = 'acoustic unplugged live session';
      else if (activeFilter === 'concert') query = 'coldplay live concert performance full';

      const tracks = await searchLiveMusicEvents(query, activeFilter);
      setSearchResults(tracks);
    } catch (err: any) {
      console.error('Error fetching live events:', err);
      setErrorMsg(err.message || 'Could not load real-time content. Verify your connection or YouTube API key.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setErrorMsg(null);
    try {
      const tracks = await searchLiveMusicEvents(searchQuery.trim(), activeFilter);
      setSearchResults(tracks);
      if (tracks.length === 0) {
        setErrorMsg('No live music performances matching that term could be retrieved.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Search execution failed. Check search query or API limit parameters.');
    } finally {
      setIsSearching(false);
    }
  };

  // Podcast search handler — searches YouTube for broadcasts like YT Music
  const handlePodcastSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastSearchQuery.trim()) return;
    setIsPodcastSearching(true);
    setErrorMsg(null);
    try {
      const query = `${podcastSearchQuery.trim()} podcast`;
      const results = await searchYoutubeMusic(query, 'long');
      const normalized = results
        .filter(track => track.duration >= 600)
        .map(track => ({
          ...track,
          isPodcast: true,
          category: 'Search Result',
        }));
      setPodcastSearchFeedResults(normalized);
      if (normalized.length === 0) {
        setErrorMsg('No podcasts found matching that search. Try different keywords.');
      }
    } catch (err: any) {
      console.error('Podcast search error:', err);
      setErrorMsg(err.message || 'Search failed. Check your connection or API key.');
    } finally {
      setIsPodcastSearching(false);
    }
  };

  // Add/remove custom podcasts from categories
  const handleAddPodcastToCategory = (track: Track, category: string) => {
    const updatedTrack = {
      ...track,
      isPodcast: true,
      category: category
    };
    
    setCustomPodcasts(prev => {
      const exists = prev.some(p => p.id === track.id);
      const updated = exists ? prev.map(p => p.id === track.id ? updatedTrack : p) : [...prev, updatedTrack];
      localStorage.setItem('playme_custom_podcasts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveCustomPodcast = (trackId: string) => {
    setCustomPodcasts(prev => {
      const updated = prev.filter(p => p.id !== trackId);
      localStorage.setItem('playme_custom_podcasts', JSON.stringify(updated));
      return updated;
    });
  };

  const getCustomPodcastCategory = (trackId: string) => {
    const found = customPodcasts.find(p => p.id === trackId);
    return found ? found.category : null;
  };

  // Pre-seeded local podcasts + custom added podcasts
  const localPodcasts = [
    ...allTracks.filter(track => track.isPodcast && !podcastSearchResults.find(res => res.id === track.id)),
    ...customPodcasts
  ];
  const filteredLocalPodcasts = selectedPodcastCategory === 'all'
    ? localPodcasts
    : localPodcasts.filter(track => track.category === selectedPodcastCategory);

  const podcastCategories = [
    { id: 'all', label: 'All Episodes', Icon: Layers },
    { id: 'Business & Entrepreneurship', label: 'Business', Icon: Briefcase },
    { id: 'Technology & AI', label: 'Tech & AI', Icon: Cpu },
    { id: 'Finance & Investing', label: 'Finance', Icon: Coins },
    { id: 'Self-Improvement', label: 'Self Growth', Icon: Brain },
    { id: 'Health & Fitness', label: 'Health', Icon: Flame },
    { id: 'Education', label: 'Education', Icon: BookOpen },
    { id: 'News', label: 'News', Icon: Newspaper },
    { id: 'Sports', label: 'Sports', Icon: Trophy },
    { id: 'Entertainment', label: 'Entertainment', Icon: Film },
    { id: 'Spirituality', label: 'Spirituality', Icon: Compass },
  ];

  return (
    <div id="live-stage-feed" className="px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-8 pb-24 select-none">
      
      {/* Sub-tab switcher: Podcast Hub vs Music Hub vs Digital Concert Stage */}
      <div className="flex justify-center border-b border-white/5 pb-4">
        <div className="flex bg-black/40 border border-white/10 rounded-full p-1 gap-1.5 shadow-2xl backdrop-blur-md flex-wrap justify-center">
          <button
            onClick={() => { setStageMode('music'); setSelectedMusicChannel(null); setMusicSearchFeedResults([]); setMusicSearchQuery(''); }}
            className={`px-5 py-2 rounded-full font-bold text-xs md:text-sm tracking-wide transition-all duration-300 cursor-pointer select-none uppercase flex items-center gap-2 ${
              stageMode === 'music'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 scale-[1.03]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Music2 size={14} className={stageMode === 'music' ? 'animate-bounce' : ''} style={{ animationDuration: '2s' }} />
            <span>Music Hub</span>
          </button>
          <button
            onClick={() => setStageMode('podcast')}
            className={`px-5 py-2 rounded-full font-bold text-xs md:text-sm tracking-wide transition-all duration-300 cursor-pointer select-none uppercase flex items-center gap-2 ${
              stageMode === 'podcast'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 scale-[1.03]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Compass size={14} className={stageMode === 'podcast' ? 'animate-spin-slow' : ''} />
            <span>Podcast Hub</span>
          </button>
          <button
            onClick={() => setStageMode('concert')}
            className={`px-5 py-2 rounded-full font-bold text-xs md:text-sm tracking-wide transition-all duration-300 cursor-pointer select-none uppercase flex items-center gap-2 ${
              stageMode === 'concert'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 scale-[1.03]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tv size={14} />
            <span>Digital Concert Stage</span>
          </button>
        </div>
      </div>

      {stageMode === 'podcast' ? (
        // ==========================================
        // 🎙️ PODCAST HUB (DEFAULT / PRIMARY VIEW)
        // ==========================================
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Immersive Podcast Hero Banner */}
          <section 
            id="podcast-hub-hero"
            className="relative rounded-3xl overflow-hidden p-8 md:p-12 border border-white/5 bg-gradient-to-r from-[#201418] via-[#121319] to-[#0c0d0f] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/5 rounded-full hidden md:block blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#00f2ff]/5 rounded-full hidden md:block blur-[70px] pointer-events-none" />

            <div className="max-w-2xl relative z-10">
              <span className="uppercase tracking-widest text-[9px] font-mono font-bold text-[#00f2ff] bg-[#00f2ff]/10 px-3 py-1 rounded-full border border-[#00f2ff]/20">
                Premium Audio Experiences
              </span>
              <h2 className="font-headline font-semibold text-3xl md:text-5xl text-white tracking-tight leading-tight mt-4">
                Listen. Discover. <span className="text-pink-500">Grow.</span>
              </h2>
              <p className="text-gray-400 font-sans text-xs md:text-sm mt-3.5 leading-relaxed max-w-lg">
                Dive deep into captivating conversations, untold stories, and fresh perspectives from top creators. Select a podcast below to instantly stream high-fidelity episodes and broaden your horizons.
              </p>
            </div>
          </section>

          {/* Podcast Channels Directory - Glassy & Transparent */}
          <section className="flex flex-col gap-5 bg-transparent p-0 select-none">
            <div className="flex justify-center md:justify-end pb-1.5 border-b border-white/5">
              {/* Host Group Selection Tabs */}
              <div className="flex bg-white/[0.03] border border-white/10 rounded-full p-1 select-none gap-1">
                <button
                  onClick={() => setHostGroup('top')}
                  className={`group px-4 py-1.5 rounded-full font-bold text-[9.5px] uppercase transition-all duration-300 cursor-pointer flex items-center gap-1.5 border backdrop-blur-md ${
                    hostGroup === 'top' 
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30 shadow-[0_0_12px_rgba(0,242,255,0.15)]' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Award size={11} className={`transition-all duration-500 group-hover:scale-125 ${hostGroup === 'top' ? 'animate-pulse text-[#00f2ff]' : 'text-gray-400'}`} />
                  <span>Top Picks</span>
                </button>
                <button
                  onClick={() => setHostGroup('global')}
                  className={`group px-4 py-1.5 rounded-full font-bold text-[9.5px] uppercase transition-all duration-300 cursor-pointer flex items-center gap-1.5 border backdrop-blur-md ${
                    hostGroup === 'global' 
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30 shadow-[0_0_12px_rgba(0,242,255,0.15)]' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Globe size={11} className={`transition-all duration-500 group-hover:rotate-[360deg] ${hostGroup === 'global' ? 'animate-spin-slow text-[#00f2ff]' : 'text-gray-400'}`} />
                  <span>Global</span>
                </button>
                <button
                  onClick={() => setHostGroup('indian')}
                  className={`group px-4 py-1.5 rounded-full font-bold text-[9.5px] uppercase transition-all duration-300 cursor-pointer flex items-center gap-1.5 border backdrop-blur-md ${
                    hostGroup === 'indian' 
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/30 shadow-[0_0_12px_rgba(0,242,255,0.15)]' 
                      : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <MapPin size={11} className={`transition-all duration-500 group-hover:translate-y-[-2px] ${hostGroup === 'indian' ? 'animate-bounce text-[#00f2ff]' : 'text-gray-400'}`} />
                  <span>Indian</span>
                </button>
              </div>
            </div>

            {/* Horizontal Scroll of Circular Host Avatars (Instagram Story style) */}
            <ScrollContainer gapClass="gap-5" className="w-full">
              {activeHosts.map((host) => {
                const isActive = selectedHost === host.name;
                const liveDetails = cachedHostDetails[host.name];
                return (
                  <div
                    key={host.name}
                    onClick={() => setSelectedHost(isActive ? null : host.name)}
                    className="flex flex-col items-center gap-2 cursor-pointer shrink-0 group select-none relative pb-1"
                  >
                    {/* Instagram Story Gradient Ring Frame */}
                    <div className={`rounded-full p-[2px] transition-all duration-500 shadow-md ${
                      isActive 
                        ? 'bg-gradient-to-tr from-[#00f2ff] via-pink-500 to-[#ec4899] scale-105 shadow-[0_0_15px_rgba(0,242,255,0.3)] animate-pulse' 
                        : 'bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-[#00f2ff] group-hover:via-pink-500 group-hover:to-[#ec4899] group-hover:scale-105'
                    }`}>
                      {/* Black inner border spacer (just like real Instagram Stories) */}
                      <div className="rounded-full p-[2.5px] bg-[#0c0d0f] flex items-center justify-center">
                        {/* Avatar Image Frame */}
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center overflow-hidden border border-white/5 relative bg-gradient-to-tr ${host.gradient}`}>
                          <img 
                            src={liveDetails?.dpUrl || host.dpUrl || `/api/youtube/channel-avatar?handle=${encodeURIComponent(host.handle)}`} 
                            alt={host.name} 
                            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-110 animate-floating" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                            referrerPolicy="no-referrer"
                          />
                          {/* Fallback Initials */}
                          <div className={`hidden absolute inset-0 w-full h-full flex flex-col items-center justify-center font-headline font-bold text-xs md:text-sm text-white bg-gradient-to-tr ${host.gradient}`}>
                            {host.initials}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Name + Subscribers Layout */}
                    <div className="flex flex-col items-center justify-center max-w-[65px] md:max-w-[76px] w-full gap-0.5 mt-0.5">
                      <div className="flex items-center justify-center gap-1 w-full">
                        <span className={`text-[10px] font-bold text-center truncate transition-colors ${
                          isActive ? 'text-[#00f2ff]' : 'text-white/60 group-hover:text-white'
                        }`} title={host.name}>
                          {host.name.split(' ')[0]} {/* Grab first name for clean story list */}
                        </span>
                        <span 
                          className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-blue-500 text-white text-[7px] font-extrabold shrink-0 select-none" 
                          title="Verified Channel"
                          style={{ transform: 'scale(0.85)' }}
                        >
                          ✓
                        </span>
                      </div>
                      <span className="text-[8px] text-white/50 text-center truncate w-full group-hover:text-white/70 transition-colors font-medium">
                        {liveDetails?.subscribers || host.fallbackSubscribers}
                      </span>
                    </div>
                  </div>
                );
              })}
            </ScrollContainer>
          </section>



          {/* Dynamic Feed Header OR Category Filter */}
          {!selectedHost && (
            <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
              {/* Row 1: Search bar (YT Music style, aligned on larger screens, full width on small screens) */}
              <div className="flex justify-end select-none">
                <form onSubmit={handlePodcastSearchSubmit} className="flex gap-2 w-full md:w-[420px] select-none">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search podcasts (like YT Music)..."
                      value={podcastSearchQuery}
                      onChange={(e) => setPodcastSearchQuery(e.target.value)}
                      className="w-full pl-9.5 pr-4 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-white focus:outline-hidden focus:border-[#00f2ff]/50 font-medium placeholder-[#b9cacb]/45 font-sans backdrop-blur-md shadow-inner transition-colors duration-300"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b9cacb]/45" size={14} />
                  </div>
                  <button
                    type="submit"
                    disabled={isPodcastSearching}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-xs tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg shadow-pink-500/25"
                  >
                    {isPodcastSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                    <span>Search</span>
                  </button>
                </form>
              </div>

              {/* Row 2: Category Filter list using ScrollContainer */}
              <ScrollContainer className="w-full">
                {podcastCategories.map((cat) => {
                  const Icon = cat.Icon;
                  const isActive = selectedPodcastCategory === cat.id && podcastSearchFeedResults.length === 0;

                  // Animation classes depending on category
                  let animClass = "transition-all duration-500 ease-out group-hover/btn:scale-125";
                  if (cat.id === 'Technology & AI' || cat.id === 'Spirituality' || cat.id === 'all') {
                    animClass += " group-hover/btn:rotate-[360deg]";
                  } else if (cat.id === 'Finance & Investing' || cat.id === 'Sports') {
                    animClass += " group-hover/btn:-translate-y-1";
                  } else if (cat.id === 'Self-Improvement' || cat.id === 'Health & Fitness') {
                    animClass += " group-hover/btn:animate-pulse";
                  } else if (cat.id === 'Education') {
                    animClass += " group-hover/btn:-rotate-12";
                  }

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedPodcastCategory(cat.id);
                        setPodcastSearchFeedResults([]);
                        setPodcastSearchQuery('');
                      }}
                      className={`group/btn px-4.5 py-2.5 rounded-full font-bold text-xs transition-all tracking-wide cursor-pointer shrink-0 uppercase select-none flex items-center gap-2.5 backdrop-blur-md border ${
                        isActive
                          ? 'bg-gradient-to-r from-[#00f2ff]/25 to-[#00f2ff]/5 text-[#00f2ff] border-[#00f2ff]/40 shadow-[0_0_15px_rgba(0,242,255,0.2)] scale-[1.02]'
                          : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-[#b9cacb] hover:text-[#e5e2e3]'
                      }`}
                    >
                      <Icon size={14} className={`${animClass} ${isActive ? 'text-[#00f2ff]' : 'text-[#b9cacb]/80 group-hover/btn:text-[#e5e2e3]'}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </ScrollContainer>
            </div>
          )}

          {/* ─── Host Profile Banner (when a host is selected) ─── */}
          {selectedHost && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-2">
              {/* Host Avatar */}
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#00f2ff]/30 shadow-[0_0_15px_rgba(0,242,255,0.15)] shrink-0">
                {(() => {
                  const allHosts = [...TOP_HOSTS, ...GLOBAL_HOSTS, ...INDIAN_HOSTS];
                  const hostObj = allHosts.find(h => h.name === selectedHost);
                  const liveDetails = cachedHostDetails[selectedHost];
                  return (
                    <img
                      src={liveDetails?.dpUrl || hostObj?.dpUrl || `/api/youtube/channel-avatar?handle=${encodeURIComponent(hostObj?.handle || '')}`}
                      alt={selectedHost}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  );
                })()}
              </div>
              {/* Host Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-lg font-bold text-white truncate">{selectedHost}</h3>
                  <span className="text-[#00f2ff] shrink-0">✓</span>
                </div>
                <p className="text-xs text-[#b9cacb]/60 font-sans">
                  {cachedHostDetails[selectedHost]?.subscribers || (() => {
                    const allHosts = [...TOP_HOSTS, ...GLOBAL_HOSTS, ...INDIAN_HOSTS];
                    return allHosts.find(h => h.name === selectedHost)?.fallbackSubscribers || 'N/A';
                  })()} 
                  {' · '}{podcastSearchResults.length} episodes loaded
                </p>
              </div>
              {/* Back button */}
              <button
                onClick={() => setSelectedHost(null)}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                ← All Podcasts
              </button>
            </div>
          )}

          {/* Podcasts Grid Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label-mono text-[10px] text-white/40 uppercase tracking-widest">
                {podcastSearchFeedResults.length > 0 
                  ? `YouTube Podcast Results (${podcastSearchFeedResults.length})` 
                  : selectedHost
                    ? `${selectedHost}'s Episodes (${podcastSearchResults.length})`
                    : `Available Episodes (${filteredLocalPodcasts.length})`}
              </h3>
              {podcastSearchFeedResults.length > 0 && (
                <button
                  onClick={() => {
                    setPodcastSearchFeedResults([]);
                    setPodcastSearchQuery('');
                  }}
                  className="px-3 py-1 rounded-full bg-pink-500/10 hover:bg-pink-500/25 border border-pink-500/20 text-pink-400 text-[10px] font-bold uppercase transition-all cursor-pointer"
                >
                  Close Search & View Catalog
                </button>
              )}
            </div>

            {isSearchingPodcasts ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-[#00f2ff] bg-black/10 border border-white/5 rounded-3xl shadow-xl">
                <Loader2 size={36} className="animate-spin mb-3 text-[#00f2ff]" />
                <p className="text-xs md:text-sm font-bold uppercase tracking-wider font-mono">
                  🎙️ Searching YouTube for {selectedHost}'s podcast streams...
                </p>
                <p className="text-[10px] text-white/40 mt-1 font-sans">Retrieving original high-fidelity video sets</p>
              </div>
            ) : errorMsg && (selectedHost || podcastSearchFeedResults.length > 0) ? (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 max-w-2xl font-sans">
                <Radio size={14} className="animate-pulse shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (podcastSearchFeedResults.length > 0 ? podcastSearchFeedResults : (selectedHost ? podcastSearchResults : filteredLocalPodcasts)).length === 0 ? (
              <div className="text-center py-20 border border-white/5 bg-[#1c1b1c]/10 rounded-2xl text-[#b9cacb]">
                <Radio size={36} className="text-white/20 mx-auto mb-3" />
                <p className="text-sm font-semibold">No Podcast Episodes Found</p>
                <p className="text-xs text-[#b9cacb]/60 mt-1 max-w-md mx-auto">
                  Try switching to "All Episodes" or select another host to discover broadcasts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(podcastSearchFeedResults.length > 0 ? podcastSearchFeedResults : (selectedHost ? podcastSearchResults : filteredLocalPodcasts)).map((track) => {
                  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
                  const durationMins = Math.floor(track.duration / 60);
                  const customCat = getCustomPodcastCategory(track.id);
                  const displayCategory = customCat || (podcastCategories.some(c => c.id === track.category && c.id !== 'all') ? track.category : null);

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, [track, ...(podcastSearchFeedResults.length > 0 ? podcastSearchFeedResults : (selectedHost ? podcastSearchResults : localPodcasts))])}
                      className={`flex flex-col justify-between rounded-3xl bg-[#1c1b1c]/40 border group transition-all duration-300 relative overflow-hidden p-4 cursor-pointer ${
                        isCurrentlyPlaying
                          ? 'border-[#00f2ff]/40 shadow-[0_0_25px_rgba(0,242,255,0.08)] bg-[#00f2ff]/5'
                          : 'border-white/5 hover:border-white/15 hover:bg-[#1c1b1c]/60'
                      }`}
                    >
                      {/* Thumbnail / Cover Art */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3.5 bg-black">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {/* Hover Overlay play state */}
                        <div className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity duration-300 ${
                          isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div className="w-12 h-12 rounded-full bg-[#00f2ff] text-[#002022] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center">
                            <Play size={18} className="fill-[#002022] translate-x-0.5" />
                          </div>
                        </div>

                        {/* Save (Favorite) button overlay on card top-right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(track.id);
                          }}
                          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-black/80 hover:scale-115 active:scale-95 transition-all"
                          title={isFavorite(track.id) ? 'Saved' : 'Bookmark to library'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-all ${
                              isFavorite(track.id)
                                ? 'text-pink-500 fill-pink-500 scale-110 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]'
                                : 'text-white/60 hover:text-white'
                            }`}
                          />
                        </button>

                        {/* Duration Badge */}
                        <span className="absolute bottom-2.5 right-2.5 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-white/80 font-semibold select-none border border-white/5">
                          ⏱️ {durationMins}m
                        </span>
                      </div>

                      {/* Info & Text layout */}
                      <div className="flex-1 flex flex-col justify-between font-sans">
                        <div className="flex flex-col">
                          <h4 className="font-semibold text-[13px] leading-snug text-white line-clamp-2 select-text group-hover:text-[#00f2ff] transition-colors" title={track.title}>
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-[#b9cacb]/60 mt-1">
                            Host: <span className="text-[#00f2ff]/80 font-bold">{track.artist}</span>
                          </p>
                          <p className="text-[11.5px] text-white/40 leading-relaxed line-clamp-2 mt-2">
                            {track.description}
                          </p>
                        </div>
                        
                        {/* Category tag */}
                        {displayCategory ? (
                          <div className="flex items-center gap-1.5 mt-3.5 self-start">
                            <span className="px-2.5 py-0.5 bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-[8.5px] font-bold text-[#00f2ff] rounded-full uppercase tracking-wider font-sans">
                              🏷️ {podcastCategories.find(c => c.id === displayCategory)?.label || displayCategory}
                            </span>
                            {customCat && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomPodcast(track.id);
                                }}
                                className="w-4 h-4 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-[10px] text-white/60 transition-colors cursor-pointer"
                                title="Remove from category"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="relative inline-block mt-3.5 self-start" onClick={(e) => e.stopPropagation()}>
                            <select
                              onChange={(e) => {
                                const cat = e.target.value;
                                if (cat) {
                                  handleAddPodcastToCategory(track, cat);
                                  e.target.value = '';
                                }
                              }}
                              className="appearance-none bg-white/5 border border-white/5 text-[9px] font-bold text-[#00f2ff] hover:text-white rounded-full px-3 py-1 pr-6 cursor-pointer font-sans uppercase tracking-wider outline-none hover:bg-white/10 transition-all select-none"
                            >
                              <option value="" className="bg-[#1c1b1c] text-white">📂 Add to Category</option>
                              {podcastCategories.filter(cat => cat.id !== 'all').map(cat => (
                                <option key={cat.id} value={cat.id} className="bg-[#1c1b1c] text-white text-xs py-2">
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00f2ff] pointer-events-none text-[8px]">▼</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : stageMode === 'music' ? (
        <MusicHubView />
      ) : (
        // ==========================================
        // 🎸 CONCERT LIVE STAGE (SECONDARY VIEW)
        // ==========================================
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Immersive Event Hero Banner */}
          <section 
            id="live-broadcasting-hero"
            className="relative rounded-3xl overflow-hidden p-8 md:p-12 border border-white/5 bg-gradient-to-r from-[#1c142c] via-[#101925] to-[#0d0d0e] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
          >
            {/* Atmosphere glowing halo */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f2ff]/10 rounded-full hidden md:block blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#ff5ec3]/5 rounded-full hidden md:block blur-[70px] pointer-events-none" />

            <div className="max-w-2xl relative z-10">
              <h2 className="font-headline font-semibold text-3xl md:text-5xl text-white tracking-tight leading-tight">
                The Digital Concert <span className="text-[#00f2ff]">Stage</span>
              </h2>
              <p className="text-gray-400 font-sans text-xs md:text-sm mt-3 leading-relaxed">
                Stream concert tours, live festival sets, acoustic sessions, and live web radios directly onto your player dashboard.
              </p>
            </div>
          </section>

          {/* Control Filters & Search Tool */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            {/* Filters tab lists */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none font-sans">
              {(['all', 'live', 'concert', 'festival', 'acoustic'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4.5 py-2 rounded-full font-bold text-xs transition-all tracking-wide cursor-pointer shrink-0 uppercase select-none ${
                    activeFilter === type
                      ? 'bg-[#00f2ff] text-[#00363a] shadow-[0_4px_12px_rgba(0,242,255,0.25)]'
                      : 'bg-white/5 hover:bg-white/10 text-[#b9cacb] hover:text-[#e5e2e3]'
                  }`}
                >
                  {type === 'all' && 'All Sets'}
                  {type === 'live' && '🔴 Live Streams'}
                  {type === 'concert' && 'Concert Tours'}
                  {type === 'festival' && 'Festivals'}
                  {type === 'acoustic' && 'Acoustic Sets'}
                </button>
              ))}
            </div>

            {/* Live Search submission box */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-96 select-none">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search live acoustic, techno, arena metal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2 rounded-full bg-[#1c1b1c] border border-white/10 text-xs text-white focus:outline-hidden focus:border-[#00f2ff] font-medium placeholder-[#b9cacb]/40 font-sans"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b9cacb]/40" size={14} />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 rounded-full bg-[#00f2ff] hover:bg-[#00f2ff]/90 text-[#002022] font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                <span>Go</span>
              </button>
            </form>
          </section>

          {/* Error / Alert Messaging */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 max-w-2xl animate-fade-in font-sans">
              <Radio size={14} className="animate-pulse shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Stage Grid */}
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-label-mono text-[10px] text-white/40 uppercase tracking-widest">
                {activeFilter === 'live' ? 'ACTIVE CHANNELS NOW BROADCASTING' : 'HIGH FIDELITY LIVE SETS'} ({searchResults.length})
              </h3>
              {isSearching && (
                <div className="flex items-center gap-1.5 text-xs text-[#00f2ff] font-mono">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Updating satellite streams...</span>
                </div>
              )}
            </div>

            {searchResults.length === 0 && !isSearching ? (
              <div className="text-center py-20 border border-white/5 bg-[#1c1b1c]/10 rounded-2xl text-[#b9cacb]">
                <Radio size={36} className="text-white/20 mx-auto mb-3" />
                <p className="text-sm font-semibold">No Live Broadcasts Loaded</p>
                <p className="text-xs text-[#b9cacb]/60 mt-1 max-w-md mx-auto">
                  Please enter a live search keyword above or configure your application with an active Google YouTube API key in settings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((track) => {
                  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, [track, ...allTracks])}
                      className={`flex flex-col rounded-3xl bg-[#1c1b1c]/40 border group transition-all duration-300 relative overflow-hidden p-4 cursor-pointer ${
                        isCurrentlyPlaying
                          ? 'border-[#00f2ff]/40 shadow-[0_0_25px_rgba(0,242,255,0.08)] bg-[#00f2ff]/5'
                          : 'border-white/5 hover:border-white/10 hover:bg-[#1c1b1c]/60'
                      }`}
                    >
                      {/* Thumbnail / Cover Art */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden mb-3.5 bg-black">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity duration-300 ${
                          isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div className="w-12 h-12 rounded-full bg-[#00f2ff] text-[#002022] hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center">
                            <Play size={18} className="fill-[#002022] translate-x-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Details block containing only the Title */}
                      <div className="flex-1 flex flex-col justify-start font-sans">
                        <h4 className="font-semibold text-[13px] leading-snug text-white line-clamp-2 select-text group-hover:text-[#00f2ff] transition-colors" title={track.title}>
                          {track.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
