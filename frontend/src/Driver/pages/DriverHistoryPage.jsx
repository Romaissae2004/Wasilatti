import React, { useState } from 'react';
import { useDriver } from '../../context/DriverContext';
import Side from '../../components/layout/Side';
import TopBar from '../../components/layout/TopBar';
import { MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

const DriverHistoryPage = () => {
  const { orders } = useDriver();
  const [selected, setSelected] = useState(null);

  const completedOrders = orders.filter(o => ['Livrée', 'Retournée', 'Annulée'].includes(o.status));

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f5f0e8' }}>
      <Side />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20 }}>
          <div style={{ background: 'rgba(255, 253, 248, 0.95)', borderRadius: 16, border: '1px solid #ede8df', padding: 20, boxShadow: '0 2px 12px rgba(180,140,80,0.06)', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2d2a22' }}>Historique récent</h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#969696' }}>{completedOrders.length} commande(s) livrée(s), retournée(s) ou annulée(s)</p>
            </div>
            {completedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed #ede8df', borderRadius: 10, color: '#969696', fontSize: 12 }}>
                Aucune commande livrée ou retournée.
              </div>
            ) : (
              completedOrders.map(order => (
                <div key={order.id} onClick={() => setSelected(order)} style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: selected?.id === order.id ? '1.5px solid #2d2a22' : '1px solid #ede8df',
                  background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#2d2a22' }}>{order.id} • {order.client}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: '#969696' }}>{order.date}</p>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 6px', borderRadius: 6,
                    background: order.status === 'Livrée' ? '#e6f4ea' : '#fce8e6',
                    color: order.status === 'Livrée' ? '#137333' : '#c5221f',
                    display: 'flex', alignItems: 'center', gap: 3
                  }}>
                    {order.status === 'Livrée' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {selected ? (
              <div style={{ flex: 1, background: 'rgba(255, 253, 248, 0.95)', borderRadius: 16, border: '1px solid #ede8df', padding: 20, boxShadow: '0 2px 12px rgba(180,140,80,0.06)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ borderBottom: '1px solid #ede8df', paddingBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f48c06' }}>RÉCAPITULATIF</span>
                  <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#2d2a22' }}>{selected.id}</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #ede8df' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#969696' }}>Client</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2d2a22' }}>{selected.client}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#969696' }}>Adresse</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2d2a22', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {selected.address}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#969696' }}>Montant</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f48c06' }}>{selected.amount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#969696' }}>Date</span>
                    <span style={{ fontSize: 12, color: '#2d2a22', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {selected.date}</span>
                  </div>
                </div>
                <div style={{
                  padding: '12px', borderRadius: 10,
                  backgroundColor: selected.status === 'Livrée' ? '#e6f4ea' : '#fce8e6',
                  color: selected.status === 'Livrée' ? '#137333' : '#c5221f',
                  fontSize: 12, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}>
                  {selected.status === 'Livrée' ? <><CheckCircle size={16} /> Livraison finalisée avec succès</> :
                   selected.status === 'Retournée' ? <><XCircle size={16} /> Colis retourné au dépôt</> :
                   <><XCircle size={16} /> Commande annulée</>}
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, background: 'rgba(255, 253, 248, 0.8)', borderRadius: 16, border: '1px solid #ede8df', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#969696', fontSize: 12 }}>
                Sélectionnez une commande de l'historique pour voir le récapitulatif.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverHistoryPage;