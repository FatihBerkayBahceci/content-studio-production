import clsx from 'clsx';
import { Card, CardBody, CardTitle } from 'react-bootstrap';
import { Link } from 'react-router-dom';
const ComponentContainerCard = ({
  title,
  id,
  description,
  children,
  titleClass,
  descriptionClass
}) => {
  return <Card>
      <CardBody>
        <CardTitle as={'h5'} className={clsx('anchor mb-1', titleClass)} id={id}>
          {title}
          <Link className="anchor-link" to={`#${id}`}>
            #
          </Link>
        </CardTitle>
        {!!description && <p className={clsx('text-muted', descriptionClass)}>{description}</p>}
        <>{children}</>
      </CardBody>
    </Card>;
};
export default ComponentContainerCard;