const { createClient } = require('@supabase/supabase-js');

async function checkDeposits() {
  const supabaseUrl = 'https://copoaparisrnfrnzvvfa.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcG9hcGFyaXNybmZybnp2dmZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MDI5MywiZXhwIjoyMDkzOTE2MjkzfQ.s44NGebzF-Oii3jKOmDrpmRcTO3lWMtcI1ewkD2ImzM';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('pix_deposits')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching deposits:', error);
  } else {
    console.log('Last 5 deposits:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkDeposits();
