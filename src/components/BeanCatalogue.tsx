import type { Bean } from '../types';
import { BeanCard } from './BeanCard';

interface BeanCatalogueProps {
  beans: Bean[];
}

export function BeanCatalogue({ beans }: BeanCatalogueProps) {
  return (
    <section className="panel" aria-labelledby="bean-catalogue-heading">
      <h2 id="bean-catalogue-heading">Bean catalogue</h2>
      <p className="panel__intro">Reference beans for your shots.</p>
      <ul className="card-list">
        {beans.map((bean) => (
          <li key={bean.id}>
            <BeanCard bean={bean} />
          </li>
        ))}
      </ul>
    </section>
  );
}
