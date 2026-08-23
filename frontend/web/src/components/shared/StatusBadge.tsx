interface StatusBadgeProps {
  /** Uppercase snake status, e.g. PENDING_APPROVAL. */
  status: string | undefined | null;
  size?: 'sm' | 'md';
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PENDING: 'Pending', IN_PROGRESS: 'In Progress',
  PENDING_APPROVAL: 'Pending Approval', APPROVED: 'Approved', REJECTED: 'Rejected',
  ACTIVE: 'Active', INACTIVE: 'Inactive', SUSPENDED: 'Suspended',
  FAILED: 'Failed', EXPIRED: 'Expired', PROCESSING: 'Processing',
  PUBLISHED: 'Published', UNPUBLISHED: 'Unpublished', VERIFIED: 'Verified',
  NOT_STARTED: 'Not Started', PLACED: 'Placed', CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled', RETURN_REQUESTED: 'Return Requested', RETURNED: 'Returned',
  SECURITY_SCAN: 'Security Scan', MODERATION: 'Moderation',
  MEDIA_PROCESSING: 'Media Processing', UPLOADED: 'Uploaded',
  PENDING_REVIEW: 'Pending Review', SENT: 'Sent', ACCEPTED: 'Accepted', REVOKED: 'Revoked',
  SUCCESS: 'Success', REQUEST_CHANGES: 'Changes Requested',
  // Creator content moderation
  UPLOADING: 'Uploading', SCANNING: 'Scanning', UNDER_REVIEW: 'Under Review',
  // Campaign participation
  INVITED: 'Invited', DECLINED: 'Declined',
  PRODUCT_SHIPPED: 'Product Shipped', PRODUCT_RECEIVED: 'Product Received',
  CONTENT_PENDING: 'Content Pending', CONTENT_SUBMITTED: 'Content Submitted',
  PROMOTING: 'Promoting', COMPLETED: 'Completed',
  PAID: 'Paid',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  // Callers occasionally pass a field that does not exist on the record. A
  // badge is never important enough to take the page down with it.
  if (!status) return null;
  const cssClass = `status-${status.toLowerCase()}`;
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${cssClass} ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
    >
      {label}
    </span>
  );
}
