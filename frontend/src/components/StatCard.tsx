import React from 'react';
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

interface StatCardProps {
  icon: string;
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, changeType }) => {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="bg-content2 p-2 rounded-md">
            <Icon icon={icon} className="text-2xl text-primary" />
          </div>
          <div className={`text-sm ${changeType === 'increase' ? 'text-success' : 'text-danger'}`}>
            {change}
          </div>
        </div>
        <h3 className="text-2xl font-semibold mt-2">{value}</h3>
        <p className="text-foreground-500 text-sm">{title}</p>
      </CardBody>
    </Card>
  );
};

export default StatCard;