import React from 'react';
import { FaEdit } from 'react-icons/fa';
import SimpleUserAvatar from './SimpleUserAvatar';
import styles from '../styles/EditableAvatar.module.css';

const EditableAvatar = ({ avatar, size = 'xlarge', onEdit }) => {
  // Log temporário para debug
  console.log('🖼️ [EditableAvatar] Recebido:', { avatar, type: typeof avatar, length: avatar?.length });

  return (
    <div className={styles.editableContainer}>
      <SimpleUserAvatar
        avatar={avatar}
        size={size}
        className={styles.editableAvatar}
      />
      {onEdit && (
        <div
          className={styles.editIcon}
          onClick={onEdit}
          title="Editar avatar"
        >
          <FaEdit />
        </div>
      )}
    </div>
  );
};

export default EditableAvatar;
