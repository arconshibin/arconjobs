import React from 'react';
import { Card, CardBody, Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import StatCard from './StatCard';
import ActionCard from './ActionCard';
import PerformanceChart from './PerformanceChart';
import AccountBalance from './AccountBalance';

const Dashboard = () => {
  return (
    <main className="flex-1 p-4 overflow-auto bg-background">
      <p className="text-foreground-500 mb-8">Monitor your workflows and system performance</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ActionCard
          icon="lucide:plus"
          title="New workflow"
          description="Create a new automation"
          color="success"
        />
        <ActionCard
          icon="lucide:alert-triangle"
          title="View breaches"
          description="Check failed workflows"
          color="danger"
        />
        <ActionCard
          icon="lucide:refresh-cw"
          title="Re-run last failed"
          description="Retry failed executions"
          color="primary"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="lucide:git-branch"
          title="Total Workflows"
          value="237"
          change="+12%"
          changeType="increase"
        />
        <StatCard
          icon="lucide:check-circle"
          title="Success Rate"
          value="98.7%"
          change="+0.3%"
          changeType="increase"
        />
        <StatCard
          icon="lucide:clock"
          title="Avg Response"
          value="38s"
          change="-2.1s"
          changeType="decrease"
        />
        <StatCard
          icon="lucide:users"
          title="Active Users"
          value="1,423"
          change="+8.2%"
          changeType="increase"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardBody>
            <PerformanceChart />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <AccountBalance />
          </CardBody>
        </Card>
      </div>
    </main>
  );
};

export default Dashboard;