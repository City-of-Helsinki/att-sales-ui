import cx from 'classnames';
import { Button, Dialog, IconPlus } from 'hds-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddCustomerCommentMutation, useGetCustomerCommentsQuery } from '../../redux/services/api';
import formatDateTime from '../../utils/formatDateTime';

import styles from './CustomerComments.module.scss';

const T_PATH = 'components.customers.CustomerComments';

const CustomerComments: React.FC<{ customerId: number }> = ({ customerId }) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: comments = [] } = useGetCustomerCommentsQuery(customerId);
  const [addCustomerComment] = useAddCustomerCommentMutation();

  const handleOpenDialog = () => {
    setNewComment('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewComment('');
  };

  const handleAddComment = async (content: string) => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await addCustomerComment({ customerId, content: content.trim() }).unwrap();
      setIsDialogOpen(false);
      setNewComment('');
    } catch (e) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.commentsRoot}>
      <div className={styles.commentsHeader}>
        <Button iconLeft={<IconPlus />} onClick={handleOpenDialog} variant="secondary" size="small">
          {t(`${T_PATH}.addComment`)}
        </Button>
      </div>
      <div className={styles.commentsTableWrap}>
        {comments.length === 0 ? (
          <div className={styles.noComments}>{t(`${T_PATH}.noComments`)}</div>
        ) : (
          <table className={cx('hds-table hds-table--light', styles.commentsTable)}>
            <thead>
              <tr>
                <th style={{ width: 0, paddingRight: 0 }}>{t(`${T_PATH}.tableHeaderNumber`)}</th>
                <th>{t(`${T_PATH}.tableHeaderContent`)}</th>
                <th>{t(`${T_PATH}.tableHeaderAuthor`)}</th>
                <th>{t(`${T_PATH}.tableHeaderCreatedAt`)}</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment, idx) => (
                <tr key={comment.id}>
                  <td style={{ paddingRight: 0 }}>{idx + 1}.</td>
                  <td>{comment.content}</td>
                  <td>
                    {comment.author.first_name} {comment.author.last_name}
                    {comment.author.email && <span>&nbsp;&ndash;&nbsp;{comment.author.email}</span>}
                  </td>
                  <td>{formatDateTime(comment.created_at, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Dialog
        aria-labelledby="customer-add-comment-dialog-title"
        id="customer-add-comment-dialog"
        isOpen={isDialogOpen}
        close={handleCloseDialog}
        closeButtonLabelText={t(`${T_PATH}.addCommentCancel`)}
      >
        <Dialog.Header id="customer-add-comment-dialog-title" title={t(`${T_PATH}.addCommentDialogTitle`)} />
        <Dialog.Content>
          <textarea
            className={styles.commentTextarea}
            placeholder={t(`${T_PATH}.addCommentPlaceholder`)}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
            style={{ width: '100%', resize: 'vertical' }}
            maxLength={1000}
          />
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button onClick={() => handleAddComment(newComment)} disabled={isSubmitting || !newComment.trim()}>
            {t(`${T_PATH}.addCommentSubmit`)}
          </Button>
          <Button variant="secondary" onClick={handleCloseDialog} disabled={isSubmitting}>
            {t(`${T_PATH}.addCommentCancel`)}
          </Button>
        </Dialog.ActionButtons>
      </Dialog>
    </div>
  );
};

export default CustomerComments;
