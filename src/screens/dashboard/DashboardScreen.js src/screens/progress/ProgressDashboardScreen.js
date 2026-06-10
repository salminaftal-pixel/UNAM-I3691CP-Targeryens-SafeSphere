import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import colors from '../../styles/colors';

function SummaryCard({ label, value, detail, tone }) {
  return (
    <Card style={[styles.summaryCard, { borderLeftColor: tone }]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryDetail}>{detail}</Text>
    </Card>
  );
}

function CourseProgress({ course, navigation }) {
  const progress = course.progress || 0;
  const isStarted = progress > 0;

  return (
    <View style={styles.courseBox}>
      <Text style={styles.courseTitle}>{course.title}</Text>
      <Text style={[styles.status, isStarted ? styles.inProgress : styles.notStarted]}>
        {isStarted ? 'In Progress' : 'Not Started'}
      </Text>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Progress</Text>
        <Text style={styles.progressPercent}>{progress}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <Button
        title={isStarted ? 'Continue Learning' : 'Start Course'}
        variant="secondary"
        style={styles.courseButton}
        onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
      />
    </View>
  );
}

export default function ProgressDashboardScreen({ navigation, training }) {
  const courses = training?.courses || [];
  const activeCourses = courses.filter((course) => course.progress > 0 && course.progress < 100).length;
  const completedCourses = courses.filter((course) => course.progress === 100).length;
  const averageProgress = courses.length ? Math.round(courses.reduce((sum, course) => sum + (course.progress || 0), 0) / courses.length) : 0;

  return (
    <View style={styles.screen}>
      <Header title="My Progress" subtitle="Track your learning achievements" backLabel="Back to Dashboard" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {training?.trainingError ? (
          <Card style={styles.statusCard}>
            <Text style={styles.statusTitle}>Progress could not load</Text>
            <Text style={styles.statusText}>{training.trainingError}</Text>
            <Button title="Retry" onPress={training.reloadTraining} variant="secondary" style={styles.retryButton} />
          </Card>
        ) : !training?.trainingLoaded ? (
          <Card style={styles.statusCard}>
            <ActivityIndicator color={colors.orange} />
            <Text style={styles.statusText}>Loading progress from Firebase...</Text>
          </Card>
        ) : courses.length === 0 ? (
          <Card style={styles.statusCard}>
            <Text style={styles.statusTitle}>No progress data available</Text>
            <Text style={styles.statusText}>Courses must load from Firestore before progress can be shown.</Text>
            <Button title="Retry" onPress={training.reloadTraining} variant="secondary" style={styles.retryButton} />
          </Card>
        ) : null}

        <View style={styles.summaryGrid}>
          <SummaryCard label="OVERALL PROGRESS" value={`${averageProgress}%`} detail="" tone={colors.amber} />
          <SummaryCard label="COMPLETED" value={completedCourses} detail={`of ${courses.length} courses`} tone={colors.green} />
          <SummaryCard label="IN PROGRESS" value={activeCourses} detail="active courses" tone={colors.blue} />
          <SummaryCard label="AVERAGE SCORE" value={`${training?.quizAverage || 0}%`} detail="quiz average" tone={colors.violet} />
        </View>

        {courses.length > 0 ? (
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Course Progress Details</Text>
            <Text style={styles.sectionSubtitle}>Detailed breakdown of your progress in each course</Text>
            {courses.map((course) => (
              <CourseProgress key={course.id} course={course} navigation={navigation} />
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 42,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 22,
  },
  statusCard: {
    marginBottom: 18,
  },
  statusTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  statusText: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 120,
    borderLeftWidth: 4,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 22,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  summaryDetail: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  detailCard: {
    padding: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    paddingTop: 22,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    color: colors.muted,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  courseBox: {
    margin: 18,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 18,
    backgroundColor: colors.surface,
  },
  courseTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 18,
  },
  inProgress: {
    color: '#806500',
    backgroundColor: '#fff5a8',
  },
  notStarted: {
    color: colors.muted,
    backgroundColor: '#f3f4f6',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: colors.ink,
    fontWeight: '700',
  },
  progressPercent: {
    color: colors.amber,
    fontWeight: '900',
  },
  track: {
    height: 10,
    backgroundColor: '#fff0d8',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.navy,
  },
  courseButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
  },
});
