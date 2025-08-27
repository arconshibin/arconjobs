import React from 'react';
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  color: 'primary' | 'success' | 'danger';
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, description, color }) => {
  return (
    <Card className="cursor-pointer hover:bg-content2 transition-colors">
      <CardBody className="flex items-center">
        <div className={`mr-4 p-2 rounded-md bg-${color}/20`}>
          <Icon icon={icon} className={`text-2xl text-${color}`} />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-foreground-500">{description}</p>
        </div>
      </CardBody>
    </Card>
  );
};

export default ActionCard;