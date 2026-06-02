'use client';

import { useMemo } from 'react';
import type { Device, Store } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

interface StateStatsProps {
    devices: Device[];
    stores: Store[];
    loading: boolean;
}

export function StateStats({ devices, stores, loading }: StateStatsProps) {

    const { statsByState, overallStats } = useMemo(() => {
        if (!devices.length || !stores.length) {
            return { statsByState: [], overallStats: { total: 0, online: 0, offline: 0, errors: 0 } };
        }

        const storesMap = new Map(stores.map(store => [store.id, store]));
        const stateCounts: { [key: string]: { online: number, offline: number, errors: number } } = {};
        let online = 0;
        let offline = 0;
        let errors = 0;

        devices.forEach(device => {
            if (device.connectionStatus === 'error') {
                errors++;
            }
            if (device.status === 'online') {
                online++;
            } else {
                offline++;
            }
            const store = storesMap.get(device.storeId);
            if (store) {
                if (!stateCounts[store.state]) {
                    stateCounts[store.state] = { online: 0, offline: 0, errors: 0 };
                }
                if (device.status === 'online') {
                    stateCounts[store.state].online++;
                } else {
                    stateCounts[store.state].offline++;
                }
                if (device.connectionStatus === 'error') {
                     stateCounts[store.state].errors++;
                }
            }
        });

        const stats = Object.entries(stateCounts).map(([state, counts]) => ({
            state,
            online: counts.online,
            offline: counts.offline,
            errors: counts.errors,
        })).sort((a, b) => (b.online + b.offline) - (a.online + a.offline));

        return { 
            statsByState: stats, 
            overallStats: { total: devices.length, online, offline, errors }
        };

    }, [devices, stores]);

    const chartConfig = {
        online: {
            label: 'Online',
            color: 'hsl(var(--chart-2))',
        },
        offline: {
            label: 'Offline',
            color: 'hsl(var(--destructive))',
        },
        errors: {
            label: 'Errors',
            color: 'hsl(var(--chart-3))',
        }
    } satisfies ChartConfig;

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
                <Card className="col-span-1 md:col-span-4">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[250px] w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Total Screens</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{overallStats.total}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Online</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-500">{overallStats.online}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Offline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-destructive">{overallStats.offline}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Errors</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-yellow-500">{overallStats.errors}</div>
                </CardContent>
            </Card>
             <Card className="col-span-1 md:col-span-4">
                <CardHeader>
                    <CardTitle>Screens per State</CardTitle>
                    <CardDescription>Distribution of online and offline screens across Mexico.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                         <ResponsiveContainer>
                            <BarChart data={statsByState} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                                <YAxis />
                                <XAxis 
                                    dataKey="state" 
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="online" fill="var(--color-online)" stackId="a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="offline" fill="var(--color-offline)" stackId="a" />
                                <Bar dataKey="errors" fill="var(--color-errors)" stackId="a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
