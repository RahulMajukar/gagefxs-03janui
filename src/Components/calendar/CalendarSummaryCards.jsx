import { 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  Package,
  XCircle,
  AlertCircle
} from 'lucide-react'
import moment from 'moment'

export default function CalendarSummaryCards({ stats, events }) {
  // Use stats from backend or calculate from events
  const calculateStats = () => {
    if (stats) {
      return {
        total: stats.total || 0,
        accepted: stats.byStatus?.accepted || 0,
        pending: stats.byStatus?.pending || 0,
        declined: stats.byStatus?.rejected || 0,
        upcoming: stats.upcomingEvents || 0,
        today: stats.todayEvents || 0,
        owned: stats.byOwnership?.owned || 0,
        attending: stats.byOwnership?.attending || 0,
      }
    }

    // Fallback calculation from events
    const now = moment()
    const upcomingEvents = events.filter(event => moment(event.start).isAfter(now))
    const todayEvents = events.filter(event => moment(event.start).isSame(now, 'day'))
    
    const accepted = events.filter(event => 
      event.acceptanceStatus === 'accepted'
    ).length
    
    const pending = events.filter(event => 
      event.acceptanceStatus === 'pending'
    ).length
    
    const declined = events.filter(event => 
      event.acceptanceStatus === 'declined'
    ).length
    
    const owned = events.filter(event => 
      event.userRelationship === 'owner' || event.isOwner
    ).length
    
    const attending = events.filter(event => 
      event.userRelationship === 'attendee' || event.isAttendee
    ).length

    return {
      total: events.length,
      accepted,
      pending,
      declined,
      upcoming: upcomingEvents.length,
      today: todayEvents.length,
      owned,
      attending,
    }
  }

  const calculatedStats = calculateStats()

  const cards = [
    {
      title: 'Pending',
      value: calculatedStats.pending,
      change: calculatedStats.pending > 0 ? `${calculatedStats.pending} awaiting` : 'All clear',
      trend: 'neutral',
      icon: Clock,
      color: 'orange',
      bgGradient: 'from-orange-500 to-amber-500',
      description: 'Awaiting your response'
    },
    {
      title: 'Upcoming',
      value: calculatedStats.upcoming,
      change: `${calculatedStats.today} today`,
      trend: 'up',
      icon: ArrowUpRight,
      color: 'blue',
      bgGradient: 'from-blue-500 to-indigo-500',
      description: 'Future events'
    },
    {
      title: 'Calibrated',
      value: calculatedStats.accepted,
      change: `${calculatedStats.owned} owned`,
      trend: 'up',
      icon: CheckCircle,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500',
      description: 'Confirmed attendance'
    },
    {
      title: 'Past',
      value: calculatedStats.declined,
      change: calculatedStats.declined === 0 ? 'None' : `${calculatedStats.declined} rejected`,
      trend: 'neutral',
      icon: XCircle,
      color: 'red',
      bgGradient: 'from-red-500 to-rose-500',
      description: 'Rejected invitations'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        const TrendIcon = card.trend === 'up' ? TrendingUp : AlertCircle
        
        return (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Gradient background accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.bgGradient} opacity-10 rounded-full -mr-16 -mt-16`} />
            
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.bgGradient} shadow-md`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                
                <div className={`flex items-center space-x-1 text-xs font-medium ${
                  card.trend === 'up' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  <TrendIcon className="h-3 w-3" />
                  <span>{card.change}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </h3>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {card.title}
                </p>
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            </div>
            
            {/* Bottom accent line */}
            <div className={`h-1 bg-gradient-to-r ${card.bgGradient}`} />
          </div>
        )
      })}

      {/* Additional summary info */}
      <div className="mt-2 p-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-700">Total Events</span>
          </div>
          <span className="font-bold text-blue-600">{calculatedStats.total}</span>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-gray-700">Owned</span>
          </div>
          <span className="font-bold text-indigo-600">{calculatedStats.owned}</span>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-gray-700">Attending</span>
          </div>
          <span className="font-bold text-purple-600">{calculatedStats.attending}</span>
        </div>
      </div>
    </div>
  )
}