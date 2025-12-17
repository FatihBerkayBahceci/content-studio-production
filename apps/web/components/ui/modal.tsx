'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================
// Modal Context
// ============================================
interface ModalContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(undefined);

function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within a Modal provider');
  }
  return context;
}

// ============================================
// Modal Root
// ============================================
interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Modal({ open = false, onOpenChange, children }: ModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(open);

  const isControlled = onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <ModalContext.Provider value={{ open: isOpen, onOpenChange: setIsOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

// ============================================
// Modal Trigger
// ============================================
interface ModalTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

function ModalTrigger({ children, asChild }: ModalTriggerProps) {
  const { onOpenChange } = useModalContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
}

// ============================================
// Modal Portal
// ============================================
interface ModalPortalProps {
  children: React.ReactNode;
}

function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

// ============================================
// Modal Overlay
// ============================================
interface ModalOverlayProps {
  className?: string;
}

function ModalOverlay({ className }: ModalOverlayProps) {
  const { onOpenChange } = useModalContext();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
        className
      )}
      onClick={() => onOpenChange(false)}
    />
  );
}

// ============================================
// Modal Content
// ============================================
interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

function ModalContent({
  children,
  className,
  size = 'md',
  showCloseButton = true,
}: ModalContentProps) {
  const { open, onOpenChange } = useModalContext();

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  return (
    <ModalPortal>
      <AnimatePresence>
        {open && (
          <>
            <ModalOverlay />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={cn(
                  'relative w-full rounded-2xl',
                  'bg-[hsl(0_0%_4%)] backdrop-blur-xl',
                  'border border-[hsl(var(--glass-border-default))]',
                  'shadow-2xl shadow-black/50',
                  sizeClasses[size],
                  className
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors z-10"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                )}

                {children}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}

// ============================================
// Modal Header
// ============================================
interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 px-6 pt-6 pb-4',
        'border-b border-[hsl(var(--glass-border-subtle))]',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// Modal Title
// ============================================
interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2
      className={cn(
        'text-lg font-semibold text-foreground leading-none tracking-tight',
        className
      )}
    >
      {children}
    </h2>
  );
}

// ============================================
// Modal Description
// ============================================
interface ModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function ModalDescription({ children, className }: ModalDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
}

// ============================================
// Modal Body
// ============================================
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

// ============================================
// Modal Footer
// ============================================
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4',
        'border-t border-[hsl(var(--glass-border-subtle))]',
        'bg-[hsl(var(--glass-bg-1))]',
        'rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// Modal Close Button
// ============================================
interface ModalCloseProps {
  children: React.ReactNode;
  asChild?: boolean;
}

function ModalClose({ children, asChild }: ModalCloseProps) {
  const { onOpenChange } = useModalContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        onOpenChange(false);
      },
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange(false)}>
      {children}
    </button>
  );
}

// ============================================
// Confirmation Modal (Pre-built variant)
// ============================================
interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm" showCloseButton={false}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose asChild>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--glass-bg-interactive))] transition-colors"
              disabled={loading}
            >
              {cancelText}
            </button>
          </ModalClose>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50',
              variant === 'destructive'
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                : 'bg-primary text-white hover:bg-primary/90'
            )}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ============================================
// Exports
// ============================================
export {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
  ConfirmModal,
};
