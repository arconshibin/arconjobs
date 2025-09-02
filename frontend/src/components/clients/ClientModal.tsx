import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import React from "react";

interface FooterButton {
  label: string;
  variant?: "light" | "flat" | "solid" | "ghost" | "primary" | "danger";
  onClick: () => void;
  loading?: boolean;
  color?: "primary" | "danger";
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: string;
  showFooter?: boolean;
  footerContent?: FooterButton[]; // Array of button configs
  className?: string;
}

const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "lg",
  showFooter = true,
  footerContent,
  className = "",
}) => (
  <Modal
    isOpen={isOpen}
    onOpenChange={onClose}
    placement="center"
    size={size}
    className={`w-full max-w-full sm:max-w-lg ${className}`}
  >
    <ModalContent>
      {() => (
        <>
          <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
          <ModalBody>{children}</ModalBody>
          {showFooter && (
            <ModalFooter>
              <div className="flex gap-x-2 w-full">
                {footerContent && footerContent.length > 0 ? (
                  footerContent.map((btn, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant={btn.variant ?? "light"}
                      color={btn.color}
                      onPress={btn.onClick}
                      isLoading={btn.loading}
                      className="w-full sm:w-auto"
                    >
                      {btn.label}
                    </Button>
                  ))
                ) : (
                  <Button size="sm" variant="light" onPress={onClose} className="w-full sm:w-auto">
                    Close
                  </Button>
                )}
              </div>
            </ModalFooter>
          )}
        </>
      )}
    </ModalContent>
  </Modal>
);

export default ClientModal;